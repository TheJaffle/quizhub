import "server-only";
import crypto from "crypto";
import mysql from "mysql2/promise";

export type QuizCategoryDetail = {
  id: number;
  name: string;
  slug: string;
  quizCount: number;
};

export type CategoryQuiz = {
  id: number;
  slug: string;
  title: string;
  image: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timeLimit: number;
  reward: string;
  players: number;
  maxPlayers: number;
  spotsLeft: number;
  almostFull: boolean;
  createdBy: string;
  creatorAvatar: string;
  rating: number;
  totalRatings: number;
};

export type QuizDetail = CategoryQuiz & {
  categorySlug: string;
};

export type LatestQuizCard = {
  id: number;
  slug: string;
  title: string;
  image: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timeLimit: number;
  createdBy: string;
  creatorAvatar: string;
};

export type RecentQuizPerformanceCard = {
  id: number;
  slug: string;
  title: string;
  image: string;
  category: string;
  playerName: string;
  playerAvatar: string;
  score: number | null;
  totalQuestions: number | null;
  elapsedSeconds: number | null;
  performanceScore: number;
  uniquePlayersCount: number;
  playUrl: string;
  reward: string;
};

export type TopAveragePlayerCard = {
  playerKey: string;
  playerName: string;
  playerAvatar: string;
  averagePercent: number;
  attemptsCount: number;
  totalCorrect: number;
  totalQuestions: number;
  bestQuizTitle: string;
  bestQuizCategory: string;
  bestQuizImage: string;
  bestQuizScore: number;
  bestQuizTotalQuestions: number;
  playUrl: string;
};

export type QuizAnswerOption = {
  id: number;
  label: string;
  text: string;
  imageUrl: string | null;
};

export type QuizPlayQuestion = {
  id: number;
  text: string;
  imageUrl: string | null;
  position: number;
  correctAnswerId: number | null;
  answers: QuizAnswerOption[];
};

export type QuizFirstQuestion = {
  quiz: QuizDetail;
  questions: QuizPlayQuestion[];
};

export type CategoryQuizzesResult =
  | { category: QuizCategoryDetail | null; quizzes: CategoryQuiz[]; error?: undefined }
  | { category: QuizCategoryDetail | null; quizzes: CategoryQuiz[]; error: string };

export type QuizDetailResult =
  | { quiz: QuizDetail | null; error?: undefined }
  | { quiz: QuizDetail | null; error: string };

export type QuizFirstQuestionResult =
  | { data: QuizFirstQuestion | null; error?: undefined }
  | { data: QuizFirstQuestion | null; error: string };

export type LatestQuizzesResult =
  | { quizzes: LatestQuizCard[]; error?: undefined }
  | { quizzes: LatestQuizCard[]; error: string };

export type RecentQuizPerformanceCardsResult =
  | { quizzes: RecentQuizPerformanceCard[]; error?: undefined; fallback?: boolean }
  | { quizzes: RecentQuizPerformanceCard[]; error: string; fallback?: boolean };

export type TopAveragePlayersResult =
  | { players: TopAveragePlayerCard[]; error?: undefined }
  | { players: TopAveragePlayerCard[]; error: string };

export type QuizScoreInput = {
  questionId: number;
  answerId: number;
};

export type QuizScoreTimingInput = {
  durationSeconds?: number | null;
};

export type QuizScoreUser = {
  id: number;
  pseudo: string;
};

export type QuizScoreResult =
  | { score: { totalQuestions: number; correctAnswers: number; percent: number; durationSeconds: number | null; resultSaved: boolean; resultId: number | null; resultToken: string | null; userAttached: boolean }; error?: undefined }
  | { score: null; error: string };

function shuffleAnswers<T>(answers: T[]): T[] {
  const shuffled = [...answers];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = crypto.randomInt(index + 1);
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  quiz_count: number | null;
};

type QuizRow = {
  id: number;
  slug: string;
  title: string;
  image_url: string | null;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  time_limit: number | null;
  reward: string | number | null;
  players: number | null;
  max_players: number | null;
  created_by: string | null;
  creator_avatar: string | null;
  rating: string | number | null;
  total_ratings: number | null;
};

type QuizDetailRow = QuizRow & {
  category_name: string;
  category_slug: string;
};

type RecentQuizPerformanceRow = {
  id: number;
  slug: string;
  title: string;
  image_url: string | null;
  reward: string | number | null;
  category_name: string;
  player_name: string | null;
  player_avatar: string | null;
  score: number;
  total_questions: number;
  duration_seconds: number | null;
  time_limit: number | null;
  unique_players_count: number;
};

type TopAveragePlayerRow = {
  player_key: string;
  player_name: string | null;
  player_avatar: string | null;
  average_percent: string | number;
  attempts_count: number;
  total_correct: string | number;
  total_questions: string | number;
  best_quiz_title: string;
  best_quiz_category: string;
  best_quiz_image: string | null;
  best_quiz_slug: string;
  best_quiz_score: number;
  best_quiz_total_questions: number;
};

type QuestionRow = {
  id: number;
  question_text: string;
  image_url: string | null;
  position: number;
};

type AnswerRow = {
  id: number;
  answer_text: string;
  image_url: string | null;
  position: number;
  is_correct: number;
};

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

export async function getCategoryQuizzesBySlug(slug: string): Promise<CategoryQuizzesResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [categoryRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT
         c.id,
         c.name,
         c.slug,
         COUNT(q.id) AS quiz_count
       FROM quiz_categories c
       LEFT JOIN quizzes q ON q.category_id = c.id AND q.is_active = 1
       WHERE c.slug = ? AND c.is_active = 1
       GROUP BY c.id, c.name, c.slug
       LIMIT 1`,
      [slug]
    );
    const categoryRow = (categoryRows as CategoryRow[])[0];

    if (!categoryRow) {
      return { category: null, quizzes: [] };
    }

    const [quizRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, slug, title, image_url, difficulty, time_limit, reward, players, max_players, created_by, creator_avatar, rating, total_ratings
       FROM quizzes
       WHERE category_id = ? AND is_active = 1
       ORDER BY id ASC`,
      [categoryRow.id]
    );

    const category = {
      id: categoryRow.id,
      name: categoryRow.name,
      slug: categoryRow.slug,
      quizCount: categoryRow.quiz_count ?? 0,
    };

    const quizzes = (quizRows as QuizRow[]).map((row) => {
      const players = row.players ?? 0;
      const maxPlayers = row.max_players ?? 300;
      const spotsLeft = Math.max(maxPlayers - players, 0);

      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        image: row.image_url || "/placeholder.svg",
        category: category.name,
        difficulty: row.difficulty ?? "Medium",
        timeLimit: row.time_limit ?? 15,
        reward: `$${Number(row.reward ?? 0).toFixed(2)}`,
        players,
        maxPlayers,
        spotsLeft,
        almostFull: spotsLeft <= 20,
        createdBy: row.created_by || "QuizHub",
        creatorAvatar: row.creator_avatar || "/placeholder-user.jpg",
        rating: Number(row.rating ?? 0),
        totalRatings: row.total_ratings ?? 0,
      };
    });

    return { category, quizzes };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      category: null,
      quizzes: [],
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger les quiz depuis MySQL : ${message}`
          : "Impossible de charger les quiz pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getLatestQuizzes(): Promise<LatestQuizzesResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT q.id, q.slug, q.title, q.image_url, q.difficulty, q.time_limit, q.created_by, q.creator_avatar,
              c.name AS category_name
       FROM quizzes q
       INNER JOIN quiz_categories c ON c.id = q.category_id
       WHERE q.is_active = 1 AND c.is_active = 1
       ORDER BY q.created_at DESC, q.id DESC
       LIMIT 4`
    );

    const quizzes = (rows as (QuizRow & { category_name: string })[]).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      image: row.image_url || "/placeholder.svg",
      category: row.category_name,
      difficulty: row.difficulty ?? "Medium",
      timeLimit: row.time_limit ?? 15,
      createdBy: row.created_by || "brainspark",
      creatorAvatar: row.creator_avatar || "/placeholder-user.jpg",
    }));

    return { quizzes };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      quizzes: [],
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger les derniers quiz depuis MySQL : ${message}`
          : "Impossible de charger les derniers quiz pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

function normalizeDurationSeconds(durationSeconds: number | null | undefined) {
  if (durationSeconds === null || durationSeconds === undefined) {
    return null;
  }

  if (!Number.isFinite(durationSeconds) || durationSeconds < 0 || durationSeconds > 60 * 60 * 24) {
    return null;
  }

  return Math.round(durationSeconds);
}

function calculatePerformanceScore(score: number | null, totalQuestions: number | null, elapsedSeconds: number | null, quizTimeLimit: number | null = null) {
  if (score === null || !totalQuestions || totalQuestions <= 0) {
    return 0;
  }

  const scoreRatio = score / totalQuestions;
  const scoreBase = scoreRatio * 7;
  const perQuestionReference = quizTimeLimit && quizTimeLimit > 0 ? quizTimeLimit : 15;
  const timeReference = totalQuestions * perQuestionReference;
  const speedRatio =
    elapsedSeconds !== null && timeReference > 0
      ? Math.max(0, Math.min(1, 1 - elapsedSeconds / timeReference))
      : 0;
  const speedBonus = speedRatio * 3;

  return Math.min(10, Math.round((scoreBase + speedBonus) * 10) / 10);
}

export async function getRecentQuizPerformanceCards(): Promise<RecentQuizPerformanceCardsResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `WITH first_attempts AS (
         SELECT
           qr.*,
           ROW_NUMBER() OVER (
             PARTITION BY qr.quiz_id, COALESCE(CAST(qr.user_id AS CHAR), CONCAT('guest:', qr.id))
             ORDER BY qr.created_at ASC, qr.id ASC
           ) AS attempt_rank
         FROM quiz_results qr
       ),
       eligible_attempts AS (
         SELECT *
         FROM first_attempts
         WHERE attempt_rank = 1
       ),
       recent_quizzes AS (
         SELECT quiz_id, MAX(created_at) AS latest_played_at
         FROM eligible_attempts
         GROUP BY quiz_id
         ORDER BY latest_played_at DESC
         LIMIT 4
       ),
       ranked_best AS (
         SELECT
           ea.*,
           ROW_NUMBER() OVER (
             PARTITION BY ea.quiz_id
             ORDER BY ea.score DESC, ea.duration_seconds IS NULL ASC, ea.duration_seconds ASC, ea.created_at DESC, ea.id DESC
           ) AS best_rank
         FROM eligible_attempts ea
         INNER JOIN recent_quizzes rq ON rq.quiz_id = ea.quiz_id
       ),
       unique_counts AS (
         SELECT quiz_id, COUNT(*) AS unique_players_count
         FROM eligible_attempts
         GROUP BY quiz_id
       )
       SELECT
         q.id,
         q.slug,
         q.title,
         q.image_url,
         q.reward,
         c.name AS category_name,
         COALESCE(u.pseudo, rb.player_name, 'Invité') AS player_name,
         COALESCE(u.avatar_url, q.creator_avatar, '/placeholder-user.jpg') AS player_avatar,
         rb.score,
         rb.total_questions,
         rb.duration_seconds,
         q.time_limit,
         uc.unique_players_count
       FROM ranked_best rb
       INNER JOIN quizzes q ON q.id = rb.quiz_id
       INNER JOIN quiz_categories c ON c.id = q.category_id
       INNER JOIN unique_counts uc ON uc.quiz_id = rb.quiz_id
       LEFT JOIN users u ON u.id = rb.user_id
       WHERE rb.best_rank = 1 AND q.is_active = 1 AND c.is_active = 1
       ORDER BY (SELECT latest_played_at FROM recent_quizzes rq WHERE rq.quiz_id = q.id) DESC, q.id DESC`
    );

    const quizzes = (rows as RecentQuizPerformanceRow[]).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      image: row.image_url || "/placeholder.svg",
      category: row.category_name,
      playerName: row.player_name || "Invité",
      playerAvatar: row.player_avatar || "/placeholder-user.jpg",
      score: row.score,
      totalQuestions: row.total_questions,
      elapsedSeconds: row.duration_seconds,
      performanceScore: calculatePerformanceScore(row.score, row.total_questions, row.duration_seconds, row.time_limit),
      uniquePlayersCount: row.unique_players_count,
      playUrl: `/quizzes/${row.slug}/play`,
      reward: `$${Number(row.reward ?? 0).toFixed(2)}`,
    }));

    if (quizzes.length > 0) {
      return { quizzes };
    }

    const [fallbackRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT q.id, q.slug, q.title, q.image_url, q.reward, q.players, q.created_by, q.creator_avatar,
              c.name AS category_name
       FROM quizzes q
       INNER JOIN quiz_categories c ON c.id = q.category_id
       WHERE q.is_active = 1 AND c.is_active = 1
       ORDER BY q.created_at DESC, q.id DESC
       LIMIT 4`
    );

    return {
      fallback: true,
      quizzes: (fallbackRows as (QuizRow & { category_name: string })[]).map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        image: row.image_url || "/placeholder.svg",
        category: row.category_name,
        playerName: row.created_by || "QuizHub",
        playerAvatar: row.creator_avatar || "/placeholder-user.jpg",
        score: null,
        totalQuestions: null,
        elapsedSeconds: null,
        performanceScore: 0,
        uniquePlayersCount: row.players ?? 0,
        playUrl: `/quizzes/${row.slug}/play`,
        reward: `$${Number(row.reward ?? 0).toFixed(2)}`,
      })),
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      quizzes: [],
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger les performances récentes depuis MySQL : ${message}`
          : "Impossible de charger les performances récentes pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getTopAveragePlayers(): Promise<TopAveragePlayersResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `WITH player_attempts AS (
         SELECT
           qr.*,
           CASE
             WHEN qr.user_id IS NOT NULL THEN CONCAT('user:', qr.user_id)
             ELSE CONCAT('guest:', qr.id)
           END AS player_key,
           COALESCE(u.pseudo, qr.player_name, 'Invité') AS display_name,
           COALESCE(u.avatar_url, '/placeholder-user.jpg') AS display_avatar
         FROM quiz_results qr
         LEFT JOIN users u ON u.id = qr.user_id
         WHERE qr.total_questions > 0
       ),
       player_stats AS (
         SELECT
           player_key,
           MAX(display_name) AS player_name,
           MAX(display_avatar) AS player_avatar,
           ROUND(SUM(score) / NULLIF(SUM(total_questions), 0) * 100, 1) AS average_percent,
           COUNT(*) AS attempts_count,
           SUM(score) AS total_correct,
           SUM(total_questions) AS total_questions
         FROM player_attempts
         GROUP BY player_key
       ),
       ranked_attempts AS (
         SELECT
           pa.*,
           q.slug AS quiz_slug,
           q.title AS quiz_title,
           q.image_url AS quiz_image,
           c.name AS category_name,
           ROW_NUMBER() OVER (
             PARTITION BY pa.player_key
             ORDER BY pa.percentage DESC, pa.score DESC, pa.duration_seconds IS NULL ASC, pa.duration_seconds ASC, pa.created_at DESC, pa.id DESC
           ) AS best_rank
         FROM player_attempts pa
         INNER JOIN quizzes q ON q.id = pa.quiz_id
         INNER JOIN quiz_categories c ON c.id = q.category_id
         WHERE q.is_active = 1 AND c.is_active = 1
       )
       SELECT
         ps.player_key,
         ps.player_name,
         ps.player_avatar,
         ps.average_percent,
         ps.attempts_count,
         ps.total_correct,
         ps.total_questions,
         ra.quiz_title AS best_quiz_title,
         ra.category_name AS best_quiz_category,
         ra.quiz_image AS best_quiz_image,
         ra.quiz_slug AS best_quiz_slug,
         ra.score AS best_quiz_score,
         ra.total_questions AS best_quiz_total_questions
       FROM player_stats ps
       INNER JOIN ranked_attempts ra ON ra.player_key = ps.player_key AND ra.best_rank = 1
       ORDER BY ps.average_percent DESC, ps.attempts_count DESC, ps.total_correct DESC
       LIMIT 4`
    );

    const players = (rows as TopAveragePlayerRow[]).map((row) => ({
      playerKey: row.player_key,
      playerName: row.player_name || "Invité",
      playerAvatar: row.player_avatar || "/placeholder-user.jpg",
      averagePercent: Number(row.average_percent ?? 0),
      attemptsCount: row.attempts_count,
      totalCorrect: Number(row.total_correct ?? 0),
      totalQuestions: Number(row.total_questions ?? 0),
      bestQuizTitle: row.best_quiz_title,
      bestQuizCategory: row.best_quiz_category,
      bestQuizImage: row.best_quiz_image || "/placeholder.svg",
      bestQuizScore: row.best_quiz_score,
      bestQuizTotalQuestions: row.best_quiz_total_questions,
      playUrl: `/quizzes/${row.best_quiz_slug}/play`,
    }));

    return { players };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      players: [],
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger les meilleurs joueurs depuis MySQL : ${message}`
          : "Impossible de charger les meilleurs joueurs pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getQuizBySlug(slug: string): Promise<QuizDetailResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT q.id, q.slug, q.title, q.image_url, q.difficulty, q.time_limit, q.reward, q.players, q.max_players,
              q.created_by, q.creator_avatar, q.rating, q.total_ratings,
              c.name AS category_name, c.slug AS category_slug
       FROM quizzes q
       INNER JOIN quiz_categories c ON c.id = q.category_id
       WHERE q.slug = ? AND q.is_active = 1 AND c.is_active = 1
       LIMIT 1`,
      [slug]
    );

    const row = (rows as QuizDetailRow[])[0];

    if (!row) {
      return { quiz: null };
    }

    const players = row.players ?? 0;
    const maxPlayers = row.max_players ?? 300;
    const spotsLeft = Math.max(maxPlayers - players, 0);

    return {
      quiz: {
        id: row.id,
        slug: row.slug,
        title: row.title,
        image: row.image_url || "/placeholder.svg",
        category: row.category_name,
        categorySlug: row.category_slug,
        difficulty: row.difficulty ?? "Medium",
        timeLimit: row.time_limit ?? 15,
        reward: `$${Number(row.reward ?? 0).toFixed(2)}`,
        players,
        maxPlayers,
        spotsLeft,
        almostFull: spotsLeft <= 20,
        createdBy: row.created_by || "QuizHub",
        creatorAvatar: row.creator_avatar || "/placeholder-user.jpg",
        rating: Number(row.rating ?? 0),
        totalRatings: row.total_ratings ?? 0,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      quiz: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger le quiz depuis MySQL : ${message}`
          : "Impossible de charger ce quiz pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getQuizFirstQuestionBySlug(slug: string): Promise<QuizFirstQuestionResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const quizResult = await getQuizBySlug(slug);

    if (quizResult.error) {
      return { data: null, error: quizResult.error };
    }

    if (!quizResult.quiz) {
      return { data: null };
    }

    const [questionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT qq.id, qq.question_text, qq.image_url, qq.position
       FROM quiz_questions qq
       WHERE qq.quiz_id = ? AND qq.is_active = 1
       ORDER BY qq.position ASC, qq.id ASC`,
      [quizResult.quiz.id]
    );

    const questions: QuizPlayQuestion[] = [];

    for (const questionRow of questionRows as QuestionRow[]) {
      const [answerRows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT id, answer_text, image_url, position, is_correct
         FROM quiz_answers
         WHERE question_id = ? AND is_active = 1
         ORDER BY position ASC, id ASC`,
        [questionRow.id]
      );

      const storedAnswers = answerRows as AnswerRow[];
      const correctAnswer = storedAnswers.find((answer) => answer.is_correct === 1);
      const answers = shuffleAnswers(storedAnswers).map((answer, index) => ({
        id: answer.id,
        label: String.fromCharCode(65 + index),
        text: answer.answer_text,
        imageUrl: answer.image_url,
      }));

      questions.push({
        id: questionRow.id,
        text: questionRow.question_text,
        imageUrl: questionRow.image_url,
        position: questionRow.position,
        correctAnswerId: correctAnswer?.id ?? null,
        answers,
      });
    }

    return {
      data: {
        quiz: quizResult.quiz,
        questions,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      data: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger la question depuis MySQL : ${message}`
          : "Impossible de charger la question pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function scoreQuizBySlug(slug: string, answers: QuizScoreInput[], user?: QuizScoreUser | null, timing?: QuizScoreTimingInput): Promise<QuizScoreResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const durationSeconds = normalizeDurationSeconds(timing?.durationSeconds);
    console.log("QUIZ SCORE DEBUG start", {
      slug,
      userId: user?.id ?? null,
      answersCount: answers.length,
      durationSecondsReceived: timing?.durationSeconds ?? null,
      durationSecondsNormalized: durationSeconds,
    });

    const [questionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT q.id AS quiz_id, qq.id AS question_id
       FROM quizzes q
       INNER JOIN quiz_categories c ON c.id = q.category_id
       INNER JOIN quiz_questions qq ON qq.quiz_id = q.id
       WHERE q.slug = ? AND q.is_active = 1 AND c.is_active = 1 AND qq.is_active = 1
       ORDER BY qq.position ASC, qq.id ASC`,
      [slug]
    );

    const rows = questionRows as { quiz_id: number; question_id: number }[];
    const quizId = rows[0]?.quiz_id;
    const questionIds = rows.map((question) => question.question_id);
    console.log("QUIZ SCORE DEBUG quiz lookup", {
      slug,
      quizFound: Boolean(quizId),
      questionsExpected: questionIds.length,
    });

    if (questionIds.length === 0) {
      return {
        score: {
          totalQuestions: 0,
          correctAnswers: 0,
          percent: 0,
          durationSeconds: null,
          resultSaved: false,
          resultId: null,
          resultToken: null,
          userAttached: Boolean(user),
        },
      };
    }

    const submittedAnswers = new Map<number, number>();

    for (const answer of answers) {
      if (Number.isInteger(answer.questionId) && Number.isInteger(answer.answerId)) {
        submittedAnswers.set(answer.questionId, answer.answerId);
      }
    }

    const [correctRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT qa.question_id, qa.id AS answer_id
       FROM quiz_answers qa
       WHERE qa.question_id IN (?) AND qa.is_active = 1 AND qa.is_correct = 1`,
      [questionIds]
    );

    const correctAnswers = (correctRows as { question_id: number; answer_id: number }[]).reduce((total, row) => {
      return submittedAnswers.get(row.question_id) === row.answer_id ? total + 1 : total;
    }, 0);

    const percent = Math.round((correctAnswers / questionIds.length) * 100);
    const resultToken = crypto.randomUUID();
    console.log("QUIZ SCORE DEBUG calculated", {
      slug,
      quizId,
      scoreCalculated: correctAnswers,
      totalQuestions: questionIds.length,
      percent,
    });
    const [insertResult] = await connection.execute<mysql.ResultSetHeader>(
      `INSERT INTO quiz_results (quiz_id, user_id, player_name, result_token, score, total_questions, duration_seconds, percentage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [quizId, user?.id ?? null, user?.pseudo ?? "Invité", resultToken, correctAnswers, questionIds.length, durationSeconds, percent]
    );
    console.log("QUIZ SCORE DEBUG inserted", {
      slug,
      resultId: insertResult.insertId,
      resultToken,
      durationSecondsInserted: durationSeconds,
    });

    return {
      score: {
        totalQuestions: questionIds.length,
        correctAnswers,
        percent,
        durationSeconds,
        resultSaved: true,
        resultId: insertResult.insertId,
        resultToken,
        userAttached: Boolean(user),
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";
    console.error("QUIZ SCORE DEBUG catch", {
      slug,
      userId: user?.id ?? null,
      answersCount: answers.length,
      durationSecondsReceived: timing?.durationSeconds ?? null,
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "UnknownError",
      stack: error instanceof Error ? error.stack : undefined,
    });

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
