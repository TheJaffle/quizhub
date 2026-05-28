import "server-only";
import crypto from "crypto";
import mysql from "mysql2/promise";

export type DuelDifficulty = "Easy" | "Medium" | "Hard";

export type DuelAnswer = {
  id: number;
  label: string;
  text: string;
};

export type DuelQuestion = {
  id: number;
  text: string;
  answers: DuelAnswer[];
  correctAnswerId: number;
};

export type DuelChallenge = {
  roomCode: string;
  ownerUserId: number | null;
  categorySlug: string | null;
  categoryName: string | null;
  difficulty: DuelDifficulty;
  timePerQuestion: number;
  totalQuestions: number;
  questionPayload: DuelQuestion[];
  createdAt: Date;
};

export type DuelParticipant = {
  id: number;
  email: string;
  pseudo: string | null;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  durationSeconds: number | null;
  completedAt: Date;
};

export type DuelSummary = {
  roomCode: string;
  difficulty: DuelDifficulty;
  totalQuestions: number;
  timePerQuestion: number;
  createdAt: Date;
  participants: DuelParticipant[];
};

export type DuelChallengeWithParticipants = DuelChallenge & {
  participants: DuelParticipant[];
};

export type DuelCategoryOption = {
  slug: string;
  name: string;
  questionCounts: Record<DuelDifficulty, number>;
};

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

const difficultyMap: Record<string, DuelDifficulty> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  Easy: "Easy",
  Medium: "Medium",
  Hard: "Hard",
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeDifficulty(difficulty: unknown): DuelDifficulty {
  return typeof difficulty === "string" && difficultyMap[difficulty] ? difficultyMap[difficulty] : "Medium";
}

function normalizeCategorySlug(categorySlug: unknown) {
  if (typeof categorySlug !== "string") return null;

  const normalized = categorySlug.trim().toLowerCase();

  return normalized && normalized !== "random" ? normalized : null;
}

function normalizeTimePerQuestion(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? Math.max(5, Math.min(30, Math.round(numberValue))) : 10;
}

function createRoomCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function ensureDuelTables(connection: mysql.Connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS duel_challenges (
      id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
      room_code VARCHAR(16) NOT NULL,
      owner_user_id INT(10) UNSIGNED NULL,
      category_slug VARCHAR(255) NULL,
      category_name VARCHAR(255) NULL,
      difficulty ENUM('Easy','Medium','Hard') NOT NULL DEFAULT 'Medium',
      time_per_question TINYINT(3) UNSIGNED NOT NULL DEFAULT 10,
      total_questions TINYINT(3) UNSIGNED NOT NULL DEFAULT 5,
      question_payload JSON NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_duel_challenges_room_code (room_code),
      KEY idx_duel_challenges_category_slug (category_slug),
      KEY idx_duel_challenges_owner_created (owner_user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [challengeColumns] = await connection.execute<mysql.RowDataPacket[]>("SHOW COLUMNS FROM duel_challenges");
  const columnNames = new Set(challengeColumns.map((column) => String(column.Field)));

  if (!columnNames.has("category_slug")) {
    await connection.execute("ALTER TABLE duel_challenges ADD COLUMN category_slug VARCHAR(255) NULL AFTER owner_user_id");
  }

  if (!columnNames.has("category_name")) {
    await connection.execute("ALTER TABLE duel_challenges ADD COLUMN category_name VARCHAR(255) NULL AFTER category_slug");
  }

  await connection.execute(`
    CREATE TABLE IF NOT EXISTS duel_participants (
      id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
      challenge_id BIGINT(20) UNSIGNED NOT NULL,
      user_id INT(10) UNSIGNED NULL,
      email VARCHAR(190) NOT NULL,
      pseudo VARCHAR(80) NULL,
      score INT(10) UNSIGNED NOT NULL DEFAULT 0,
      correct_answers TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
      total_questions TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
      duration_seconds INT(10) UNSIGNED NULL,
      completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_duel_participants_challenge_email (challenge_id, email),
      KEY idx_duel_participants_user_completed (user_id, completed_at),
      CONSTRAINT fk_duel_participants_challenge
        FOREIGN KEY (challenge_id) REFERENCES duel_challenges(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function getDuelCategory(connection: mysql.Connection, categorySlug: string | null) {
  if (!categorySlug) return null;

  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT id, name, slug
     FROM quiz_categories
     WHERE slug = ? AND is_active = 1
     LIMIT 1`,
    [categorySlug]
  );

  return (rows as Array<{ id: number; name: string; slug: string }>)[0] ?? null;
}

async function selectDuelQuestions(connection: mysql.Connection, difficulty: DuelDifficulty, totalQuestions: number, categorySlug: string | null) {
  const categoryFilter = categorySlug ? "AND c.slug = ?" : "";
  const params = categorySlug ? [difficulty, categorySlug] : [difficulty];
  const [questionRows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT qb.id, qb.question_text
     FROM question_bank qb
     INNER JOIN quiz_topics t ON t.id = qb.topic_id
     INNER JOIN quiz_categories c ON c.id = t.category_id
     WHERE qb.difficulty = ?
       AND qb.is_active = 1
       AND t.is_active = 1
       AND c.is_active = 1
       ${categoryFilter}
     ORDER BY RAND()
     LIMIT ${totalQuestions}`,
    params
  );
  const questions = questionRows as Array<{ id: number; question_text: string }>;

  if (questions.length < 1) {
    return [];
  }

  const questionIds = questions.map((question) => question.id);
  const [answerRows] = await connection.query<mysql.RowDataPacket[]>(
    `SELECT id, question_id, answer_key, answer_text, is_correct
     FROM question_bank_answers
     WHERE question_id IN (?)
       AND is_active = 1
     ORDER BY question_id ASC, position ASC, id ASC`,
    [questionIds]
  );
  const answersByQuestion = new Map<number, Array<{ id: number; answer_key: string; answer_text: string; is_correct: number }>>();

  for (const answer of answerRows as Array<{ id: number; question_id: number; answer_key: string; answer_text: string; is_correct: number }>) {
    const answers = answersByQuestion.get(answer.question_id) ?? [];
    answers.push(answer);
    answersByQuestion.set(answer.question_id, answers);
  }

  return questions
    .map((question) => {
      const answers = answersByQuestion.get(question.id) ?? [];
      const correctAnswer = answers.find((answer) => Number(answer.is_correct) === 1);

      if (!correctAnswer || answers.length < 2) return null;

      return {
        id: question.id,
        text: question.question_text,
        correctAnswerId: correctAnswer.id,
        answers: answers.map((answer, index) => ({
          id: answer.id,
          label: answer.answer_key || String.fromCharCode(65 + index),
          text: answer.answer_text,
        })),
      };
    })
    .filter((question): question is DuelQuestion => question !== null);
}

function parseQuestionPayload(payload: unknown): DuelQuestion[] {
  if (Array.isArray(payload)) return payload as DuelQuestion[];
  if (typeof payload !== "string") return [];

  try {
    const parsed = JSON.parse(payload);

    return Array.isArray(parsed) ? (parsed as DuelQuestion[]) : [];
  } catch {
    return [];
  }
}

export async function createDuelChallenge(payload: {
  categorySlug?: unknown;
  difficulty?: unknown;
  timePerQuestion?: unknown;
  ownerUserId?: number | null;
}) {
  let connection: mysql.Connection | undefined;
  const difficulty = normalizeDifficulty(payload.difficulty);
  const categorySlug = normalizeCategorySlug(payload.categorySlug);
  const timePerQuestion = normalizeTimePerQuestion(payload.timePerQuestion);
  const totalQuestions = 5;

  try {
    connection = await mysql.createConnection(dbConfig);
    await ensureDuelTables(connection);

    const category = await getDuelCategory(connection, categorySlug);

    if (categorySlug && !category) {
      return { challenge: null, error: "Cette catégorie n'est pas disponible pour les duels." };
    }

    const questionPayload = await selectDuelQuestions(connection, difficulty, totalQuestions, category?.slug ?? null);

    if (questionPayload.length < totalQuestions) {
      return { challenge: null, error: "Pas assez de questions disponibles pour créer ce duel." };
    }

    const roomCode = createRoomCode();

    await connection.execute(
      `INSERT INTO duel_challenges (room_code, owner_user_id, category_slug, category_name, difficulty, time_per_question, total_questions, question_payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [roomCode, payload.ownerUserId ?? null, category?.slug ?? null, category?.name ?? null, difficulty, timePerQuestion, totalQuestions, JSON.stringify(questionPayload)]
    );

    return {
      challenge: {
        roomCode,
        ownerUserId: payload.ownerUserId ?? null,
        categorySlug: category?.slug ?? null,
        categoryName: category?.name ?? null,
        difficulty,
        timePerQuestion,
        totalQuestions,
        questionPayload,
        createdAt: new Date(),
      } satisfies DuelChallenge,
      error: null,
    };
  } finally {
    await connection?.end();
  }
}

export async function getDuelChallenge(roomCode: string) {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    await ensureDuelTables(connection);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT room_code, owner_user_id, category_slug, category_name, difficulty, time_per_question, total_questions, question_payload, created_at
       FROM duel_challenges
       WHERE room_code = ?
       LIMIT 1`,
      [roomCode.trim().toUpperCase()]
    );
    const row = (rows as Array<{
      room_code: string;
      owner_user_id: number | null;
      category_slug: string | null;
      category_name: string | null;
      difficulty: DuelDifficulty;
      time_per_question: number;
      total_questions: number;
      question_payload: unknown;
      created_at: Date;
    }>)[0];

    if (!row) return { challenge: null, error: null };

    return {
      challenge: {
        roomCode: row.room_code,
        ownerUserId: row.owner_user_id,
        categorySlug: row.category_slug,
        categoryName: row.category_name,
        difficulty: row.difficulty,
        timePerQuestion: row.time_per_question,
        totalQuestions: row.total_questions,
        questionPayload: parseQuestionPayload(row.question_payload),
        createdAt: row.created_at,
      } satisfies DuelChallenge,
      error: null,
    };
  } finally {
    await connection?.end();
  }
}

export async function getDuelChallengeWithParticipants(roomCode: string) {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    await ensureDuelTables(connection);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, room_code, owner_user_id, category_slug, category_name, difficulty, time_per_question, total_questions, question_payload, created_at
       FROM duel_challenges
       WHERE room_code = ?
       LIMIT 1`,
      [roomCode.trim().toUpperCase()]
    );
    const row = (rows as Array<{
      id: number;
      room_code: string;
      owner_user_id: number | null;
      category_slug: string | null;
      category_name: string | null;
      difficulty: DuelDifficulty;
      time_per_question: number;
      total_questions: number;
      question_payload: unknown;
      created_at: Date;
    }>)[0];

    if (!row) return { challenge: null, error: null };

    const [participantRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, email, pseudo, score, correct_answers, total_questions, duration_seconds, completed_at
       FROM duel_participants
       WHERE challenge_id = ?
       ORDER BY score DESC, duration_seconds IS NULL ASC, duration_seconds ASC, completed_at ASC`,
      [row.id]
    );

    return {
      challenge: {
        roomCode: row.room_code,
        ownerUserId: row.owner_user_id,
        categorySlug: row.category_slug,
        categoryName: row.category_name,
        difficulty: row.difficulty,
        timePerQuestion: row.time_per_question,
        totalQuestions: row.total_questions,
        questionPayload: parseQuestionPayload(row.question_payload),
        createdAt: row.created_at,
        participants: (participantRows as Array<{
          id: number;
          email: string;
          pseudo: string | null;
          score: number;
          correct_answers: number;
          total_questions: number;
          duration_seconds: number | null;
          completed_at: Date;
        }>).map(mapParticipant),
      } satisfies DuelChallengeWithParticipants,
      error: null,
    };
  } finally {
    await connection?.end();
  }
}

export async function getDuelCategoryOptions() {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT
         c.name,
         c.slug,
         SUM(CASE WHEN qb.difficulty = 'Easy' AND qb.is_active = 1 THEN 1 ELSE 0 END) AS easy_count,
         SUM(CASE WHEN qb.difficulty = 'Medium' AND qb.is_active = 1 THEN 1 ELSE 0 END) AS medium_count,
         SUM(CASE WHEN qb.difficulty = 'Hard' AND qb.is_active = 1 THEN 1 ELSE 0 END) AS hard_count
       FROM quiz_categories c
       INNER JOIN quiz_topics t ON t.category_id = c.id AND t.is_active = 1
       INNER JOIN question_bank qb ON qb.topic_id = t.id AND qb.is_active = 1
       WHERE c.is_active = 1
       GROUP BY c.id, c.name, c.slug
       HAVING easy_count >= 5 OR medium_count >= 5 OR hard_count >= 5
       ORDER BY c.name ASC`
    );

    return (rows as Array<{
      name: string;
      slug: string;
      easy_count: string | number;
      medium_count: string | number;
      hard_count: string | number;
    }>).map((row) => ({
      name: row.name,
      slug: row.slug,
      questionCounts: {
        Easy: Number(row.easy_count ?? 0),
        Medium: Number(row.medium_count ?? 0),
        Hard: Number(row.hard_count ?? 0),
      },
    })) satisfies DuelCategoryOption[];
  } finally {
    await connection?.end();
  }
}

export async function submitDuelResult(payload: {
  roomCode: string;
  email: string;
  pseudo?: string | null;
  userId?: number | null;
  answers: Array<{ questionId: number; answerId: number }>;
  durationSeconds?: number | null;
}) {
  let connection: mysql.Connection | undefined;
  const email = normalizeEmail(payload.email);
  const pseudo = payload.pseudo?.trim() || null;

  if (!isValidEmail(email)) {
    return { result: null, error: "Veuillez renseigner une adresse email valide." };
  }

  try {
    connection = await mysql.createConnection(dbConfig);
    await ensureDuelTables(connection);

    const [challengeRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, total_questions, question_payload
       FROM duel_challenges
       WHERE room_code = ?
       LIMIT 1`,
      [payload.roomCode.trim().toUpperCase()]
    );
    const challenge = (challengeRows as Array<{ id: number; total_questions: number; question_payload: unknown }>)[0];

    if (!challenge) return { result: null, error: "Duel introuvable." };

    const questions = parseQuestionPayload(challenge.question_payload);
    const answerMap = new Map(payload.answers.map((answer) => [answer.questionId, answer.answerId]));
    let correctAnswers = 0;

    for (const question of questions) {
      if (answerMap.get(question.id) === question.correctAnswerId) {
        correctAnswers += 1;
      }
    }

    const totalQuestions = questions.length || challenge.total_questions;
    const score = Math.round((correctAnswers / Math.max(totalQuestions, 1)) * 100);
    const durationSeconds =
      typeof payload.durationSeconds === "number" && Number.isFinite(payload.durationSeconds)
        ? Math.max(0, Math.min(60 * 60 * 24, Math.round(payload.durationSeconds)))
        : null;

    await connection.execute(
      `INSERT INTO duel_participants
         (challenge_id, user_id, email, pseudo, score, correct_answers, total_questions, duration_seconds, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         pseudo = VALUES(pseudo),
         score = VALUES(score),
         correct_answers = VALUES(correct_answers),
         total_questions = VALUES(total_questions),
         duration_seconds = VALUES(duration_seconds),
         completed_at = NOW()`,
      [challenge.id, payload.userId ?? null, email, pseudo, score, correctAnswers, totalQuestions, durationSeconds]
    );

    return {
      result: {
        email,
        pseudo,
        score,
        correctAnswers,
        totalQuestions,
        durationSeconds,
      },
      error: null,
    };
  } finally {
    await connection?.end();
  }
}

function mapParticipant(row: {
  id: number;
  email: string;
  pseudo: string | null;
  score: number;
  correct_answers: number;
  total_questions: number;
  duration_seconds: number | null;
  completed_at: Date;
}): DuelParticipant {
  return {
    id: row.id,
    email: row.email,
    pseudo: row.pseudo,
    score: row.score,
    correctAnswers: row.correct_answers,
    totalQuestions: row.total_questions,
    durationSeconds: row.duration_seconds,
    completedAt: row.completed_at,
  };
}

export async function getMyDuelSummaries(userId: number) {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    await ensureDuelTables(connection);

    const [challengeRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, room_code, difficulty, total_questions, time_per_question, created_at
       FROM duel_challenges
       WHERE owner_user_id = ?
       ORDER BY created_at DESC, id DESC`,
      [userId]
    );
    const challenges = challengeRows as Array<{
      id: number;
      room_code: string;
      difficulty: DuelDifficulty;
      total_questions: number;
      time_per_question: number;
      created_at: Date;
    }>;

    if (challenges.length === 0) return [];

    const challengeIds = challenges.map((challenge) => challenge.id);
    const [participantRows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT id, challenge_id, email, pseudo, score, correct_answers, total_questions, duration_seconds, completed_at
       FROM duel_participants
       WHERE challenge_id IN (?)
       ORDER BY score DESC, duration_seconds IS NULL ASC, duration_seconds ASC, completed_at ASC`,
      [challengeIds]
    );
    const participantsByChallenge = new Map<number, DuelParticipant[]>();

    for (const row of participantRows as Array<{
      id: number;
      challenge_id: number;
      email: string;
      pseudo: string | null;
      score: number;
      correct_answers: number;
      total_questions: number;
      duration_seconds: number | null;
      completed_at: Date;
    }>) {
      const current = participantsByChallenge.get(row.challenge_id) ?? [];
      current.push(mapParticipant(row));
      participantsByChallenge.set(row.challenge_id, current);
    }

    return challenges.map((challenge) => ({
      roomCode: challenge.room_code,
      difficulty: challenge.difficulty,
      totalQuestions: challenge.total_questions,
      timePerQuestion: challenge.time_per_question,
      createdAt: challenge.created_at,
      participants: participantsByChallenge.get(challenge.id) ?? [],
    })) satisfies DuelSummary[];
  } finally {
    await connection?.end();
  }
}
