import "server-only";
import crypto from "crypto";
import mysql from "mysql2/promise";
import type { QuizDifficulty } from "@/lib/quiz-topics";

export type QuizSessionAnswerInput = {
  questionId: number;
  answerId: number;
};

export type QuizSessionData = {
  session: {
    token: string;
    resultToken: string | null;
    status: "started" | "finished" | "abandoned";
    difficulty: QuizDifficulty;
    score: number | null;
    totalQuestions: number;
    percentage: number | null;
    durationSeconds: number | null;
  };
  topic: {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    imageUrl: string;
    categoryName: string;
    categorySlug: string;
  };
  questions: Array<{
    id: number;
    text: string;
    imageUrl: string | null;
    position: number;
    userAnswerId: number | null;
    correctAnswerId: number | null;
    answers: Array<{
      id: number;
      label: string;
      text: string;
      imageUrl: string | null;
    }>;
  }>;
};

export type StartQuizSessionResult =
  | { sessionToken: string; resultToken: string; guestToken: string | null; url: string; questionCount: number; error?: undefined }
  | { sessionToken?: undefined; resultToken?: undefined; guestToken?: undefined; url?: undefined; questionCount?: undefined; error: string };

export type GetQuizSessionResult =
  | { data: QuizSessionData | null; error?: undefined }
  | { data: QuizSessionData | null; error: string };

export type SubmitQuizSessionResult =
  | { score: { correctAnswers: number; totalQuestions: number; percent: number; resultToken: string; durationSeconds: number | null }; error?: undefined }
  | { score: null; error: string };

type SessionRow = {
  id: number;
  session_token: string;
  result_token: string | null;
  status: "started" | "finished" | "abandoned";
  difficulty: QuizDifficulty;
  score: number | null;
  total_questions: number;
  percentage: string | number | null;
  topic_id: number;
  topic_slug: string;
  topic_name: string;
  topic_description: string | null;
  topic_image_url: string | null;
  category_name: string;
  category_slug: string;
};

type SessionQuestionRow = {
  question_id: number;
  question_text: string;
  image_url: string | null;
  position: number;
  user_answer_id: number | null;
  correct_answer_id: number | null;
};

type SessionAnswerRow = {
  id: number;
  question_id: number;
  answer_key: string;
  answer_text: string;
  image_url: string | null;
  position: number;
};

type AllowedAnswerRow = {
  question_id: number;
  answer_id: number;
  is_correct: 0 | 1;
};

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

const difficulties = new Set(["Easy", "Medium", "Hard"]);

function normalizeDifficulty(value: unknown): QuizDifficulty | null {
  return typeof value === "string" && difficulties.has(value) ? (value as QuizDifficulty) : null;
}

function normalizeDurationSeconds(durationSeconds: unknown) {
  if (durationSeconds === null || durationSeconds === undefined) return null;
  if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds) || durationSeconds < 0 || durationSeconds > 60 * 60 * 24) return null;
  return Math.round(durationSeconds);
}

export async function startQuizSession(payload: {
  topicSlug: string;
  difficulty: string;
  userId?: number | null;
  guestToken?: string | null;
  questionCount?: number;
}): Promise<StartQuizSessionResult> {
  let connection: mysql.Connection | undefined;
  const difficulty = normalizeDifficulty(payload.difficulty);
  const requestedQuestionCount = Math.max(1, Math.min(20, Number(payload.questionCount ?? 20)));

  if (!payload.topicSlug || !difficulty) {
    return { error: "Demande invalide." };
  }

  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const [topicRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id
       FROM quiz_topics
       WHERE slug = ? AND is_active = 1
       LIMIT 1`,
      [payload.topicSlug]
    );
    const topic = (topicRows as { id: number }[])[0];

    if (!topic) {
      await connection.rollback();
      return { error: "Thème introuvable." };
    }

    const [questionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id
       FROM question_bank
       WHERE topic_id = ?
         AND difficulty = ?
         AND is_active = 1
       ORDER BY RAND()
       LIMIT ${requestedQuestionCount}`,
      [topic.id, difficulty]
    );
    const questionIds = (questionRows as { id: number }[]).map((question) => question.id);

    if (questionIds.length === 0) {
      await connection.rollback();
      return { error: "Pas encore assez de questions pour lancer ce quiz." };
    }

    const sessionToken = crypto.randomUUID();
    const resultToken = crypto.randomUUID();
    const guestToken = payload.userId ? null : payload.guestToken || crypto.randomUUID();
    const [insertResult] = await connection.execute<mysql.ResultSetHeader>(
      `INSERT INTO quiz_sessions (
         session_token,
         result_token,
         user_id,
         guest_token,
         topic_id,
         difficulty,
         question_count,
         total_questions,
         status,
         started_at,
         created_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'started', NOW(), NOW())`,
      [sessionToken, resultToken, payload.userId ?? null, guestToken, topic.id, difficulty, questionIds.length, questionIds.length]
    );

    for (let index = 0; index < questionIds.length; index += 1) {
      await connection.execute(
        `INSERT INTO quiz_session_questions (session_id, question_id, position, created_at)
         VALUES (?, ?, ?, NOW())`,
        [insertResult.insertId, questionIds[index], index + 1]
      );
    }

    await connection.commit();

    return {
      sessionToken,
      resultToken,
      guestToken,
      url: `/quiz/session/${sessionToken}`,
      questionCount: questionIds.length,
    };
  } catch (error) {
    await connection?.rollback();
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de lancer la session depuis MySQL : ${message}`
          : "Impossible de lancer ce quiz pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getQuizSessionByToken(sessionToken: string): Promise<GetQuizSessionResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [sessionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT
         s.id,
         s.session_token,
         s.result_token,
         s.status,
         s.difficulty,
         s.score,
         s.total_questions,
         s.percentage,
         t.id AS topic_id,
         t.slug AS topic_slug,
         t.name AS topic_name,
         t.description AS topic_description,
         t.image_url AS topic_image_url,
         c.name AS category_name,
         c.slug AS category_slug
       FROM quiz_sessions s
       INNER JOIN quiz_topics t ON t.id = s.topic_id
       INNER JOIN quiz_categories c ON c.id = t.category_id
       WHERE s.session_token = ?
       LIMIT 1`,
      [sessionToken]
    );
    const session = (sessionRows as SessionRow[])[0];

    if (!session) {
      return { data: null };
    }

    const [questionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT
         sq.question_id,
         qb.question_text,
         qb.image_url,
         sq.position,
         sq.user_answer_id,
         correct_answer.id AS correct_answer_id
       FROM quiz_session_questions sq
       INNER JOIN question_bank qb ON qb.id = sq.question_id
       LEFT JOIN question_bank_answers correct_answer
         ON correct_answer.question_id = qb.id
        AND correct_answer.is_correct = 1
        AND correct_answer.is_active = 1
       WHERE sq.session_id = ?
       ORDER BY sq.position ASC`,
      [session.id]
    );
    const questions = questionRows as SessionQuestionRow[];
    const questionIds = questions.map((question) => question.question_id);
    let answersByQuestion = new Map<number, SessionAnswerRow[]>();

    if (questionIds.length > 0) {
      const [answerRows] = await connection.query<mysql.RowDataPacket[]>(
        `SELECT id, question_id, answer_key, answer_text, image_url, position
         FROM question_bank_answers
         WHERE question_id IN (?)
           AND is_active = 1
         ORDER BY question_id ASC, position ASC, id ASC`,
        [questionIds]
      );

      answersByQuestion = (answerRows as SessionAnswerRow[]).reduce((map, answer) => {
        const current = map.get(answer.question_id) ?? [];
        current.push(answer);
        map.set(answer.question_id, current);
        return map;
      }, new Map<number, SessionAnswerRow[]>());
    }

    return {
      data: {
        session: {
          token: session.session_token,
          resultToken: session.result_token,
          status: session.status,
          difficulty: session.difficulty,
          score: session.score,
          totalQuestions: session.total_questions,
          percentage: session.percentage === null ? null : Number(session.percentage),
          durationSeconds: null,
        },
        topic: {
          id: session.topic_id,
          slug: session.topic_slug,
          name: session.topic_name,
          description: session.topic_description,
          imageUrl: session.topic_image_url || "/placeholder.svg",
          categoryName: session.category_name,
          categorySlug: session.category_slug,
        },
        questions: questions.map((question) => ({
          id: question.question_id,
          text: question.question_text,
          imageUrl: question.image_url,
          position: question.position,
          userAnswerId: question.user_answer_id,
          correctAnswerId: question.correct_answer_id,
          answers: (answersByQuestion.get(question.question_id) ?? []).map((answer) => ({
            id: answer.id,
            label: answer.answer_key,
            text: answer.answer_text,
            imageUrl: answer.image_url,
          })),
        })),
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      data: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger la session depuis MySQL : ${message}`
          : "Impossible de charger cette session pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function submitQuizSession(
  sessionToken: string,
  answers: QuizSessionAnswerInput[],
  timing?: { durationSeconds?: number | null }
): Promise<SubmitQuizSessionResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();
    const durationSeconds = normalizeDurationSeconds(timing?.durationSeconds);
    const [sessionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, result_token, status
       FROM quiz_sessions
       WHERE session_token = ?
       LIMIT 1
       FOR UPDATE`,
      [sessionToken]
    );
    const session = (sessionRows as { id: number; result_token: string | null; status: string }[])[0];

    if (!session) {
      await connection.rollback();
      return { score: null, error: "Session introuvable." };
    }

    if (session.status === "finished") {
      await connection.rollback();
      return { score: null, error: "Cette session est déjà terminée." };
    }

    if (session.status !== "started") {
      await connection.rollback();
      return { score: null, error: "Cette session ne peut plus être soumise." };
    }

    const [questionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT question_id
       FROM quiz_session_questions
       WHERE session_id = ?
       ORDER BY position ASC`,
      [session.id]
    );
    const questionIds = (questionRows as { question_id: number }[]).map((question) => question.question_id);

    if (questionIds.length === 0) {
      await connection.rollback();
      return { score: null, error: "Cette session ne contient aucune question." };
    }

    const answerMap = new Map<number, number>();

    for (const answer of answers) {
      if (Number.isInteger(answer.questionId) && Number.isInteger(answer.answerId)) {
        answerMap.set(answer.questionId, answer.answerId);
      }
    }

    const sessionQuestionIds = new Set(questionIds);

    for (const questionId of answerMap.keys()) {
      if (!sessionQuestionIds.has(questionId)) {
        await connection.rollback();
        return { score: null, error: "Une réponse ne correspond pas aux questions de cette session." };
      }
    }

    const [allowedAnswerRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT question_id, id AS answer_id, is_correct
       FROM question_bank_answers
       WHERE question_id IN (?)
         AND is_active = 1`,
      [questionIds]
    );
    const allowedAnswersByQuestion = new Map<number, Set<number>>();
    const correctAnswerByQuestion = new Map<number, number>();

    for (const row of allowedAnswerRows as AllowedAnswerRow[]) {
      const allowedAnswers = allowedAnswersByQuestion.get(row.question_id) ?? new Set<number>();
      allowedAnswers.add(row.answer_id);
      allowedAnswersByQuestion.set(row.question_id, allowedAnswers);

      if (row.is_correct === 1) {
        correctAnswerByQuestion.set(row.question_id, row.answer_id);
      }
    }

    for (const [questionId, answerId] of answerMap.entries()) {
      if (!allowedAnswersByQuestion.get(questionId)?.has(answerId)) {
        await connection.rollback();
        return { score: null, error: "Une réponse ne correspond pas aux choix possibles de sa question." };
      }
    }

    let correctAnswers = 0;

    for (const questionId of questionIds) {
      const answerId = answerMap.get(questionId) ?? null;
      const correctAnswerId = correctAnswerByQuestion.get(questionId) ?? null;
      const isCorrect = answerId !== null && correctAnswerId !== null && answerId === correctAnswerId;

      if (isCorrect) {
        correctAnswers += 1;
      }

      await connection.execute(
        `UPDATE quiz_session_questions
         SET user_answer_id = ?,
             is_correct = ?,
             answered_at = CASE WHEN ? IS NULL THEN NULL ELSE NOW() END
         WHERE session_id = ?
           AND question_id = ?`,
        [answerId, answerId === null ? null : isCorrect ? 1 : 0, answerId, session.id, questionId]
      );
    }

    const percent = Math.round((correctAnswers / questionIds.length) * 100);
    const resultToken = session.result_token || crypto.randomUUID();

    await connection.execute(
      `UPDATE quiz_sessions
       SET result_token = ?,
           score = ?,
           total_questions = ?,
           percentage = ?,
           status = 'finished',
           finished_at = NOW()
       WHERE id = ?`,
      [resultToken, correctAnswers, questionIds.length, percent, session.id]
    );

    await connection.commit();

    return {
      score: {
        correctAnswers,
        totalQuestions: questionIds.length,
        percent,
        resultToken,
        durationSeconds,
      },
    };
  } catch (error) {
    await connection?.rollback();
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      score: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de calculer le score depuis MySQL : ${message}`
          : "Impossible de calculer le score pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getQuizSessionResultByToken(resultToken: string): Promise<GetQuizSessionResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT session_token FROM quiz_sessions WHERE result_token = ? AND status = 'finished' LIMIT 1",
      [resultToken]
    );
    const sessionToken = (rows as { session_token: string }[])[0]?.session_token;

    if (!sessionToken) {
      return { data: null };
    }

    return await getQuizSessionByToken(sessionToken);
  } finally {
    await connection?.end();
  }
}
