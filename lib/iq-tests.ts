import "server-only";
import crypto from "crypto";
import mysql from "mysql2/promise";

export type IqIntroSection = {
  id: number;
  key: string;
  title: string;
  description: string | null;
  timeLimitSeconds: number | null;
  questionCount: number;
};

export type IqTestIntro = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  totalTimeLimitSeconds: number | null;
  mainQuestionCount: number;
  mainTimeLimitSeconds: number;
  sections: IqIntroSection[];
  laterSections: IqIntroSection[];
};

export type IqTestIntroResult =
  | { test: IqTestIntro; error?: undefined }
  | { test: null; error: string };

export type CreateIqAttemptResult =
  | { attemptToken: string; nextUrl: string; blockedResultUrl?: undefined; error?: undefined }
  | { attemptToken: null; nextUrl: null; blockedResultUrl?: string; error: string };

export type CreateIqAttemptDemographics = {
  birthDate: string;
  gender: string;
};

export type IqPhaseOption = {
  id: number;
  key: string;
  text: string | null;
  imageUrl: string | null;
  position: number;
};

export type IqPhaseQuestion = {
  id: number;
  sectionId: number;
  sectionKey: string;
  sectionTitle: string;
  questionText: string | null;
  stimulusText: string | null;
  format: string;
  imageUrl: string | null;
  difficultyLevel: number;
  weight: number;
  displayTimeSeconds: number | null;
  position: number;
  overlay: {
    answersImageUrl: string;
    answerCount: number;
    gridColumns: number;
    gridRows: number;
  } | null;
  options: IqPhaseOption[];
};

export type IqAttemptPhase = {
  attempt: {
    id: number;
    token: string;
    status: string;
    userId: number | null;
    testId: number;
    testTitle: string;
    testSlug: string;
  };
  phase: "main" | "memory" | "speed";
  phaseTimeLimitSeconds: number | null;
  questions: IqPhaseQuestion[];
};

export type IqAttemptPhaseResult =
  | { data: IqAttemptPhase; error?: undefined }
  | { data: null; error: string };

export type SaveIqAttemptAnswerPayload = {
  questionId: number;
  selectedOptionId?: number | null;
  selectedPosition?: number | null;
  responseTimeMs?: number | null;
  displayedAt?: string | null;
};

export type SaveIqAttemptAnswerResult =
  | {
      answer: {
        isCorrect: boolean;
        correctOptionId: number | null;
        correctPosition: number | null;
        pointsEarned: number;
      };
      error?: undefined;
    }
  | { answer: null; error: string };

export type IqMemoryIntro = {
  attempt: {
    id: number;
    token: string;
    status: string;
    userId: number | null;
    testId: number;
    testTitle: string;
  };
  section: {
    id: number;
    key: string;
    title: string;
    description: string | null;
    questionCount: number;
    displayTimeSeconds: number;
    timeLimitSeconds: number | null;
  };
  nextUrl: string;
};

export type IqMemoryIntroResult =
  | { data: IqMemoryIntro; error?: undefined }
  | { data: null; error: string };

export type IqSpeedIntro = {
  attempt: {
    id: number;
    token: string;
    status: string;
    userId: number | null;
    testId: number;
    testTitle: string;
  };
  section: {
    id: number;
    key: string;
    title: string;
    description: string | null;
    questionCount: number;
    timeLimitSeconds: number;
  };
  nextUrl: string;
};

export type IqSpeedIntroResult =
  | { data: IqSpeedIntro; error?: undefined }
  | { data: null; error: string };

export type CompleteIqAttemptResult =
  | {
      completion: {
        attemptToken: string;
        userAttached: boolean;
        redirectUrl: string | null;
        guestResultReady: boolean;
      };
      error?: undefined;
    }
  | { completion: null; error: string };

export type CleanupAbandonedIqAttemptsResult =
  | {
      deletedAnswers: number;
      deletedAttempts: number;
      olderThanHours: number;
      statuses: string[];
      error?: undefined;
    }
  | { deletedAnswers: 0; deletedAttempts: 0; olderThanHours: number; statuses: string[]; error: string };

export type CompletedIqAttemptLookup =
  | { attemptToken: string; resultUrl: string; error?: undefined }
  | { attemptToken: null; resultUrl: null; error?: string };

export type IqResult = {
  attemptToken: string;
  testTitle: string;
  status: string;
  userId: number | null;
  startedAt: Date;
  completedAt: Date | null;
  totalQuestions: number;
  answeredQuestions: number;
  rawScore: number;
  weightedScore: number;
  estimatedIqScore: number | null;
  speedScore: number | null;
  memoryScore: number | null;
  verbalScore: number | null;
  logicScore: number | null;
  spatialScore: number | null;
  averageResponseTimeMs: number | null;
  sectionBreakdown: IqResultSectionBreakdown[];
};

export type IqResultResult =
  | { result: IqResult; error?: undefined }
  | { result: null; error: "not-found" | "unattached" | "forbidden" | "load-error" };

export type IqResultSectionBreakdown = {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  percentage: number;
};

type IqTestRow = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  total_time_limit_seconds: number | null;
};

type IqSectionRow = {
  id: number;
  section_key: string;
  title: string;
  description: string | null;
  time_limit_seconds: number | null;
  question_count: number;
};

type CountRow = {
  count: number;
};

type IqAttemptRow = {
  id: number;
  attempt_token: string;
  status: string;
  user_id: number | null;
  test_id: number;
  test_title: string;
  test_slug: string;
};

type IqQuestionRow = {
  id: number;
  section_id: number;
  section_key: string;
  section_title: string;
  question_text: string | null;
  stimulus_text: string | null;
  question_format: string;
  question_image_url: string | null;
  difficulty_level: number;
  weight: string | number;
  display_time_seconds: number | null;
  section_display_time_seconds: number | null;
  section_time_limit_seconds: number | null;
  position: number;
  answers_image_url: string | null;
  answer_count: string | number | null;
  grid_columns: number | null;
  grid_rows: number | null;
};

type IqOptionRow = {
  id: number;
  question_id: number;
  option_key: string;
  option_text: string | null;
  option_image_url: string | null;
  position: number;
};

type IqAnswerCheckRow = {
  attempt_id: number;
  test_id: number;
  section_id: number;
  section_key: string;
  user_id: number | null;
  question_id: number;
  difficulty_level: number;
  weight: string | number;
  question_format: string;
  selected_option_id: number | null;
  is_correct: number | null;
  correct_option_id: number | null;
  selected_position: number | null;
  correct_position: number | null;
};

type IqExistingAnswerRow = {
  is_correct: number;
  correct_option_id: number | null;
  correct_position: number | null;
  points_earned: string | number;
};

type IqMemoryIntroRow = {
  attempt_id: number;
  attempt_token: string;
  status: string;
  user_id: number | null;
  test_id: number;
  test_title: string;
  section_id: number;
  section_key: string;
  section_title: string;
  section_description: string | null;
  display_time_seconds: number | null;
  time_limit_seconds: number | null;
  question_count: number;
};

type IqSpeedIntroRow = {
  attempt_id: number;
  attempt_token: string;
  status: string;
  user_id: number | null;
  test_id: number;
  test_title: string;
  section_id: number;
  section_key: string;
  section_title: string;
  section_description: string | null;
  time_limit_seconds: number | null;
  question_count: number;
};

type IqResultRow = {
  attempt_token: string;
  test_id: number;
  test_title: string;
  status: string;
  user_id: number | null;
  started_at: Date;
  completed_at: Date | null;
  total_questions: number;
  answered_questions: number;
  raw_score: string | number;
  weighted_score: string | number;
  estimated_iq_score: string | number | null;
  speed_score: string | number | null;
  memory_score: string | number | null;
  verbal_score: string | number | null;
  logic_score: string | number | null;
  spatial_score: string | number | null;
  average_response_time_ms: number | null;
};

type IqSectionBreakdownRow = {
  section_key: string;
  section_title: string;
  max_score: string | number;
};

function normalizeOverlayNumber(value: string | number | null | undefined, fallback: number) {
  const numericValue = Number(value);

  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : fallback;
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) return 0;

  return Math.max(0, Math.min(100, Math.round(value)));
}

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

const MAIN_SECTION_KEYS = ["verbal", "logic", "spatial"];
const LATER_SECTION_KEYS = ["memory", "speed"];
const ABANDONED_ATTEMPT_CLEANUP_HOURS = 48;
const CLEANUP_ABANDONED_ATTEMPT_STATUSES = ["started", "abandoned"];

function mapSection(row: IqSectionRow): IqIntroSection {
  return {
    id: row.id,
    key: row.section_key,
    title: row.title,
    description: row.description,
    timeLimitSeconds: row.time_limit_seconds,
    questionCount: row.question_count,
  };
}

export async function getIqTestIntroBySlug(slug: string): Promise<IqTestIntroResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [testRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, title, slug, description, image_url, total_time_limit_seconds
       FROM iq_tests
       WHERE slug = ? AND is_active = 1
       LIMIT 1`,
      [slug]
    );
    const test = (testRows as IqTestRow[])[0];

    if (!test) {
      return { test: null, error: "Test de logique introuvable." };
    }

    const [sectionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT s.id, s.section_key, s.title, s.description, s.time_limit_seconds, COUNT(q.id) AS question_count
       FROM iq_sections s
       LEFT JOIN iq_questions q ON q.section_id = s.id AND q.is_active = 1
       WHERE s.test_id = ? AND s.is_active = 1
       GROUP BY s.id, s.section_key, s.title, s.description, s.time_limit_seconds, s.position
       ORDER BY FIELD(s.section_key, 'verbal', 'logic', 'spatial', 'memory', 'speed'), s.position ASC`,
      [test.id]
    );

    const sections = (sectionRows as IqSectionRow[]).map(mapSection);
    const mainSections = sections.filter((section) => MAIN_SECTION_KEYS.includes(section.key));
    const laterSections = sections.filter((section) => LATER_SECTION_KEYS.includes(section.key));

    return {
      test: {
        id: test.id,
        title: test.title,
        slug: test.slug,
        description: test.description,
        imageUrl: test.image_url,
        totalTimeLimitSeconds: test.total_time_limit_seconds,
        mainQuestionCount: mainSections.reduce((total, section) => total + section.questionCount, 0),
        mainTimeLimitSeconds: mainSections.reduce((total, section) => total + (section.timeLimitSeconds ?? 0), 0),
        sections: mainSections,
        laterSections,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      test: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger le test de logique depuis MySQL : ${message}`
          : "Impossible de charger le test de logique pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

const ALLOWED_IQ_GENDERS = new Set(["female", "male", "other", "prefer_not_to_say"]);

function isValidBirthDate(value: string) {
  if (!/^\d{4}-01-01$/.test(value)) return false;

  const year = Number(value.slice(0, 4));
  const currentYear = new Date().getFullYear();

  return Number.isInteger(year) && year >= 1900 && year <= currentYear;
}

export async function getCompletedIqAttemptByToken(attemptToken: string): Promise<CompletedIqAttemptLookup> {
  let connection: mysql.Connection | undefined;

  try {
    if (!attemptToken) {
      return { attemptToken: null, resultUrl: null };
    }

    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT attempt_token
       FROM iq_attempts
       WHERE attempt_token = ? AND status = 'completed'
       LIMIT 1`,
      [attemptToken]
    );
    const row = (rows as { attempt_token: string }[])[0];

    if (!row) {
      return { attemptToken: null, resultUrl: null };
    }

    return {
      attemptToken: row.attempt_token,
      resultUrl: `/iq/results/${encodeURIComponent(row.attempt_token)}`,
    };
  } catch {
    return { attemptToken: null, resultUrl: null, error: "Impossible de vérifier l'ancienne tentative QI." };
  } finally {
    await connection?.end();
  }
}

export async function getCompletedIqAttemptForUser(userId: number): Promise<CompletedIqAttemptLookup> {
  let connection: mysql.Connection | undefined;

  try {
    if (!Number.isInteger(userId) || userId <= 0) {
      return { attemptToken: null, resultUrl: null };
    }

    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT attempt_token
       FROM iq_attempts
       WHERE user_id = ? AND status = 'completed'
       ORDER BY completed_at ASC, id ASC
       LIMIT 1`,
      [userId]
    );
    const row = (rows as { attempt_token: string }[])[0];

    if (!row) {
      return { attemptToken: null, resultUrl: null };
    }

    return {
      attemptToken: row.attempt_token,
      resultUrl: `/iq/results/${encodeURIComponent(row.attempt_token)}`,
    };
  } catch {
    return { attemptToken: null, resultUrl: null, error: "Impossible de vérifier l'ancienne tentative QI." };
  } finally {
    await connection?.end();
  }
}

export async function createIqAttempt(
  slug: string,
  userId?: number | null,
  demographics?: CreateIqAttemptDemographics | null
): Promise<CreateIqAttemptResult> {
  let connection: mysql.Connection | undefined;

  try {
    const birthDate = demographics?.birthDate ?? "";
    const gender = demographics?.gender ?? "";

    if (!isValidBirthDate(birthDate) || !ALLOWED_IQ_GENDERS.has(gender)) {
      return { attemptToken: null, nextUrl: null, error: "Veuillez renseigner votre année de naissance et votre genre." };
    }

    connection = await mysql.createConnection(dbConfig);

    const [testRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id
       FROM iq_tests
       WHERE slug = ? AND is_active = 1
       LIMIT 1`,
      [slug]
    );
    const test = (testRows as { id: number }[])[0];

    if (!test) {
      return { attemptToken: null, nextUrl: null, error: "Test de logique introuvable." };
    }

    const [countRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS count
       FROM iq_questions q
       INNER JOIN iq_sections s ON s.id = q.section_id
       WHERE q.test_id = ? AND q.is_active = 1 AND s.is_active = 1`,
      [test.id]
    );
    const totalQuestions = (countRows as CountRow[])[0]?.count ?? 0;
    const attemptToken = crypto.randomUUID();
    let safeUserId: number | null = null;

    if (Number.isInteger(userId) && Number(userId) > 0) {
      const [userRows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT id
         FROM users
         WHERE id = ? AND is_active = 1
         LIMIT 1`,
        [Number(userId)]
      );
      const user = (userRows as { id: number }[])[0];

      safeUserId = user?.id ?? null;
    }

    if (safeUserId) {
      const [userColumnRows] = await connection.execute<mysql.RowDataPacket[]>("SHOW COLUMNS FROM users");
      const userColumns = new Set(userColumnRows.map((row) => String(row.Field)));

      if (userColumns.has("birth_date") && userColumns.has("gender")) {
        await connection.execute(
          `UPDATE users
           SET birth_date = ?, gender = ?
           WHERE id = ? AND is_active = 1`,
          [birthDate, gender, safeUserId]
        );
      }
    }

    await connection.execute(
      `INSERT INTO iq_attempts (test_id, user_id, birth_date, gender, attempt_token, status, started_at, total_questions)
       VALUES (?, ?, ?, ?, ?, 'started', NOW(), ?)`,
      [test.id, safeUserId, birthDate, gender, attemptToken, totalQuestions]
    );

    return {
      attemptToken,
      nextUrl: `/iq/attempt/${attemptToken}/phase/main`,
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";
    const mysqlError = error as { code?: string; errno?: number; sqlMessage?: string };

    console.error("IQ ATTEMPT CREATE ERROR", {
      slug,
      userId: userId ?? null,
      code: mysqlError.code ?? null,
      errno: mysqlError.errno ?? null,
      message,
      sqlMessage: mysqlError.sqlMessage ?? null,
      database: dbConfig.database,
      host: dbConfig.host,
    });

    return {
      attemptToken: null,
      nextUrl: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de créer une tentative de test de logique depuis MySQL : ${message}`
          : "Impossible de démarrer le test de logique pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getIqAttemptPhase(token: string, phase: "main" | "memory" | "speed"): Promise<IqAttemptPhaseResult> {
  let connection: mysql.Connection | undefined;

  if (phase !== "main" && phase !== "memory" && phase !== "speed") {
    return { data: null, error: "Phase de test indisponible." };
  }

  try {
    connection = await mysql.createConnection(dbConfig);

    const [attemptRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.id, a.attempt_token, a.status, a.user_id, a.test_id, t.title AS test_title, t.slug AS test_slug
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       WHERE a.attempt_token = ?
       LIMIT 1`,
      [token]
    );
    const attempt = (attemptRows as IqAttemptRow[])[0];

    if (!attempt) {
      return { data: null, error: "Tentative de test de logique introuvable." };
    }

    const sectionFilter =
      phase === "main"
        ? "s.section_key IN ('verbal', 'logic', 'spatial')"
        : phase === "memory"
          ? "s.section_key = 'memory'"
          : "s.section_key = 'speed'";
    const orderBy =
      phase === "main"
        ? "MD5(CONCAT(?, '-', q.id)) ASC"
        : "q.position ASC";
    const queryParams = phase === "main" ? [attempt.test_id, attempt.id, token] : [attempt.test_id, attempt.id];

    const [questionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT q.id, q.section_id, s.section_key, s.title AS section_title, q.question_text, q.stimulus_text,
              q.question_format, COALESCE(overlay.question_image_url, q.question_image_url) AS question_image_url, q.difficulty_level, q.weight,
              q.display_time_seconds, s.display_time_seconds AS section_display_time_seconds,
              s.time_limit_seconds AS section_time_limit_seconds, q.position,
              overlay.answers_image_url, overlay.answer_count, overlay.grid_columns, overlay.grid_rows
       FROM iq_questions q
       INNER JOIN iq_sections s ON s.id = q.section_id
       LEFT JOIN iq_spatial_overlay_questions overlay ON overlay.question_id = q.id AND overlay.is_active = 1
       WHERE q.test_id = ?
         AND q.is_active = 1
         AND s.is_active = 1
         AND ${sectionFilter}
         AND NOT EXISTS (
           SELECT 1
           FROM iq_attempt_answers aa
           WHERE aa.attempt_id = ? AND aa.question_id = q.id
         )
       ORDER BY ${orderBy}`,
      queryParams
    );
    const questions = questionRows as IqQuestionRow[];
    const questionIds = questions.map((question) => question.id);

    let optionRows: IqOptionRow[] = [];
    if (questionIds.length > 0) {
      const placeholders = questionIds.map(() => "?").join(", ");
      const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT id, question_id, option_key, option_text, option_image_url, position
         FROM iq_question_options
         WHERE is_active = 1 AND question_id IN (${placeholders})
         ORDER BY question_id ASC, position ASC`,
        questionIds
      );
      optionRows = rows as IqOptionRow[];
    }

    const optionsByQuestion = new Map<number, IqPhaseOption[]>();
    for (const option of optionRows) {
      const list = optionsByQuestion.get(option.question_id) ?? [];
      list.push({
        id: option.id,
        key: option.option_key,
        text: option.option_text,
        imageUrl: option.option_image_url,
        position: option.position,
      });
      optionsByQuestion.set(option.question_id, list);
    }

    return {
      data: {
        attempt: {
          id: attempt.id,
          token: attempt.attempt_token,
          status: attempt.status,
          userId: attempt.user_id,
          testId: attempt.test_id,
          testTitle: attempt.test_title,
          testSlug: attempt.test_slug,
        },
        phase,
        phaseTimeLimitSeconds: questions[0] ? questions[0].section_time_limit_seconds ?? null : null,
        questions: questions.map((question) => {
          const isOverlayQuestion =
            question.question_format === "visual_overlay" || question.question_format === "spatial_overlay";
          const answerCount = normalizeOverlayNumber(question.answer_count, 4);
          const gridColumns = normalizeOverlayNumber(question.grid_columns, answerCount === 6 ? 3 : 2);
          const gridRows = normalizeOverlayNumber(question.grid_rows, 2);

          return {
            id: question.id,
            sectionId: question.section_id,
            sectionKey: question.section_key,
            sectionTitle: question.section_title,
            questionText: question.question_text,
            stimulusText: question.stimulus_text,
            format: question.question_format,
            imageUrl: question.question_image_url,
            difficultyLevel: question.difficulty_level,
            weight: Number(question.weight),
            displayTimeSeconds: question.display_time_seconds ?? question.section_display_time_seconds ?? null,
            position: question.position,
            overlay:
              isOverlayQuestion && question.answers_image_url
                ? {
                    answersImageUrl: question.answers_image_url,
                    answerCount,
                    gridColumns,
                    gridRows,
                  }
                : null,
            options: isOverlayQuestion ? [] : optionsByQuestion.get(question.id) ?? [],
          };
        }),
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      data: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger la phase de test de logique depuis MySQL : ${message}`
          : "Impossible de charger cette phase du test de logique pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function saveIqAttemptAnswer(token: string, payload: SaveIqAttemptAnswerPayload): Promise<SaveIqAttemptAnswerResult> {
  let connection: mysql.Connection | undefined;

  const hasSelectedOption = Number.isInteger(payload.selectedOptionId);
  const hasSelectedPosition = Number.isInteger(payload.selectedPosition);

  if (!Number.isInteger(payload.questionId)) {
    return { answer: null, error: "Réponse invalide." };
  }

  try {
    connection = await mysql.createConnection(dbConfig);

    const baseQuery = `SELECT a.id AS attempt_id, a.test_id, q.section_id, s.section_key, a.user_id, q.id AS question_id,
                              q.difficulty_level, q.weight, q.question_format,
                              selected.id AS selected_option_id, selected.is_correct,
                              correct.id AS correct_option_id,
                              selected.position AS selected_position,
                              correct.position AS correct_position,
                              overlay.correct_position AS overlay_correct_position,
                              overlay.answer_count AS overlay_answer_count
                       FROM iq_attempts a
                       INNER JOIN iq_questions q ON q.test_id = a.test_id
                       INNER JOIN iq_sections s ON s.id = q.section_id
                       LEFT JOIN iq_question_options selected ON selected.question_id = q.id AND selected.id = ? AND selected.is_active = 1
                       LEFT JOIN iq_question_options correct ON correct.question_id = q.id AND correct.is_correct = 1 AND correct.is_active = 1
                       LEFT JOIN iq_spatial_overlay_questions overlay ON overlay.question_id = q.id AND overlay.is_active = 1
                       WHERE a.attempt_token = ?
                         AND a.status = 'started'
                         AND q.id = ?
                         AND q.is_active = 1
                         AND s.is_active = 1
                         AND s.section_key IN ('verbal', 'logic', 'spatial', 'memory', 'speed')
                       LIMIT 1`;
    const [answerRows] = await connection.execute<mysql.RowDataPacket[]>(baseQuery, [
      hasSelectedOption ? Number(payload.selectedOptionId) : null,
      token,
      payload.questionId,
    ]);
    const rawAnswerData = (answerRows as (IqAnswerCheckRow & { overlay_correct_position: number | null; overlay_answer_count: string | number | null })[])[0];

    const isOverlayQuestion =
      rawAnswerData?.question_format === "visual_overlay" || rawAnswerData?.question_format === "spatial_overlay";
    const selectedPosition = hasSelectedPosition ? Number(payload.selectedPosition) : rawAnswerData?.selected_position ?? null;
    const isTimedOut = !hasSelectedOption && !hasSelectedPosition;
    const isMainSection =
      rawAnswerData?.section_key === "verbal" || rawAnswerData?.section_key === "logic" || rawAnswerData?.section_key === "spatial";
    const allowsTimeoutAnswer = isMainSection || rawAnswerData?.section_key === "memory";
    const answerCount = rawAnswerData?.overlay_answer_count ? Number(rawAnswerData.overlay_answer_count) : null;

    if (rawAnswerData && isTimedOut && !allowsTimeoutAnswer) {
      return { answer: null, error: "Réponse invalide." };
    }

    const answerData =
      rawAnswerData && isTimedOut && allowsTimeoutAnswer
        ? {
            ...rawAnswerData,
            selected_option_id: null,
            is_correct: 0,
            correct_option_id: rawAnswerData.correct_option_id ?? null,
            selected_position: null,
            correct_position: isOverlayQuestion ? rawAnswerData.overlay_correct_position : rawAnswerData.correct_position ?? null,
          }
        : rawAnswerData && isOverlayQuestion
        ? {
            ...rawAnswerData,
            selected_option_id: null,
            is_correct: selectedPosition === rawAnswerData.overlay_correct_position ? 1 : 0,
            correct_option_id: null,
            selected_position: selectedPosition,
            correct_position: rawAnswerData.overlay_correct_position,
          }
        : rawAnswerData
          ? { ...rawAnswerData, correct_position: rawAnswerData.correct_position ?? null }
          : null;

    if (!answerData) {
      return { answer: null, error: "Question ou réponse introuvable pour cette tentative." };
    }

    if (!isTimedOut && isOverlayQuestion) {
      const numericSelectedPosition = Number(selectedPosition);

      if (!Number.isInteger(numericSelectedPosition) || !answerCount || numericSelectedPosition < 1 || numericSelectedPosition > answerCount || !answerData.correct_position) {
        return { answer: null, error: "Zone de réponse invalide pour cette question." };
      }
    } else if (!isTimedOut && !answerData.selected_option_id) {
      return { answer: null, error: "Option de réponse invalide pour cette question." };
    }

    const [existingRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT aa.is_correct, aa.points_earned, aa.correct_position, correct.id AS correct_option_id
       FROM iq_attempt_answers aa
       LEFT JOIN iq_question_options correct ON correct.question_id = aa.question_id AND correct.is_correct = 1 AND correct.is_active = 1
       WHERE aa.attempt_id = ? AND aa.question_id = ?
       LIMIT 1`,
      [answerData.attempt_id, answerData.question_id]
    );
    const existingAnswer = (existingRows as IqExistingAnswerRow[])[0];

    if (existingAnswer) {
      return {
        answer: {
          isCorrect: existingAnswer.is_correct === 1,
          correctOptionId: existingAnswer.correct_option_id,
          correctPosition: existingAnswer.correct_position,
          pointsEarned: Number(existingAnswer.points_earned),
        },
      };
    }

    const isCorrect = answerData.is_correct === 1;
    const weight = Number(answerData.weight);
    const pointsEarned = isCorrect ? weight : 0;
    const responseTimeMsInput = payload.responseTimeMs;
    const responseTimeMs =
      typeof responseTimeMsInput === "number" && Number.isInteger(responseTimeMsInput) && responseTimeMsInput >= 0
        ? responseTimeMsInput
        : null;
    const displayedAt = payload.displayedAt ? new Date(payload.displayedAt) : null;
    const safeDisplayedAt =
      displayedAt && !Number.isNaN(displayedAt.getTime()) ? displayedAt.toISOString().slice(0, 19).replace("T", " ") : null;

    await connection.execute(
      `INSERT INTO iq_attempt_answers
       (attempt_id, test_id, section_id, question_id, user_id, selected_option_id, selected_position,
        correct_position, is_correct, difficulty_level, weight, points_earned, response_time_ms, displayed_at, answered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        answerData.attempt_id,
        answerData.test_id,
        answerData.section_id,
        answerData.question_id,
        answerData.user_id,
        answerData.selected_option_id,
        answerData.selected_position,
        answerData.correct_position,
        isCorrect ? 1 : 0,
        answerData.difficulty_level,
        weight,
        pointsEarned,
        responseTimeMs,
        safeDisplayedAt,
      ]
    );

    await connection.execute(
      `UPDATE iq_attempts
       SET answered_questions = (
             SELECT COUNT(DISTINCT question_id)
             FROM iq_attempt_answers
             WHERE attempt_id = ?
           ),
           raw_score = (
             SELECT COALESCE(SUM(points_earned), 0)
             FROM iq_attempt_answers
             WHERE attempt_id = ?
           ),
           weighted_score = (
             SELECT COALESCE(SUM(points_earned), 0)
             FROM iq_attempt_answers
             WHERE attempt_id = ?
           ),
           average_response_time_ms = (
             SELECT ROUND(AVG(response_time_ms))
             FROM iq_attempt_answers
             WHERE attempt_id = ? AND response_time_ms IS NOT NULL
           ),
           updated_at = NOW()
       WHERE id = ?`,
      [answerData.attempt_id, answerData.attempt_id, answerData.attempt_id, answerData.attempt_id, answerData.attempt_id]
    );

    return {
      answer: {
        isCorrect,
        correctOptionId: answerData.correct_option_id,
        correctPosition: answerData.correct_position,
        pointsEarned,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      answer: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible d'enregistrer la réponse de QI dans MySQL : ${message}`
          : "Impossible d'enregistrer cette réponse pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getIqMemoryIntroByAttemptToken(token: string): Promise<IqMemoryIntroResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.id AS attempt_id, a.attempt_token, a.status, a.user_id, a.test_id, t.title AS test_title,
              s.id AS section_id, s.section_key, s.title AS section_title, s.description AS section_description,
              s.display_time_seconds, s.time_limit_seconds, COUNT(q.id) AS question_count
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       INNER JOIN iq_sections s ON s.test_id = a.test_id
       LEFT JOIN iq_questions q ON q.section_id = s.id AND q.is_active = 1
       WHERE a.attempt_token = ?
         AND s.section_key = 'memory'
         AND s.is_active = 1
       GROUP BY a.id, a.attempt_token, a.status, a.user_id, a.test_id, t.title,
                s.id, s.section_key, s.title, s.description, s.display_time_seconds, s.time_limit_seconds
       LIMIT 1`,
      [token]
    );
    const row = (rows as IqMemoryIntroRow[])[0];

    if (!row) {
      return { data: null, error: "Introduction mémoire introuvable pour cette tentative." };
    }

    return {
      data: {
        attempt: {
          id: row.attempt_id,
          token: row.attempt_token,
          status: row.status,
          userId: row.user_id,
          testId: row.test_id,
          testTitle: row.test_title,
        },
        section: {
          id: row.section_id,
          key: row.section_key,
          title: row.section_title,
          description: row.section_description,
          questionCount: row.question_count,
          displayTimeSeconds: row.display_time_seconds ?? 10,
          timeLimitSeconds: row.time_limit_seconds,
        },
        nextUrl: `/iq/attempt/${row.attempt_token}/phase/memory`,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      data: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger l'introduction mémoire depuis MySQL : ${message}`
          : "Impossible de charger l'introduction mémoire pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getIqSpeedIntroByAttemptToken(token: string): Promise<IqSpeedIntroResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.id AS attempt_id, a.attempt_token, a.status, a.user_id, a.test_id, t.title AS test_title,
              s.id AS section_id, s.section_key, s.title AS section_title, s.description AS section_description,
              s.time_limit_seconds, COUNT(q.id) AS question_count
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       INNER JOIN iq_sections s ON s.test_id = a.test_id
       LEFT JOIN iq_questions q ON q.section_id = s.id AND q.is_active = 1
       WHERE a.attempt_token = ?
         AND s.section_key = 'speed'
         AND s.is_active = 1
       GROUP BY a.id, a.attempt_token, a.status, a.user_id, a.test_id, t.title,
                s.id, s.section_key, s.title, s.description, s.time_limit_seconds
       LIMIT 1`,
      [token]
    );
    const row = (rows as IqSpeedIntroRow[])[0];

    if (!row) {
      return { data: null, error: "Introduction rapidite introuvable pour cette tentative." };
    }

    return {
      data: {
        attempt: {
          id: row.attempt_id,
          token: row.attempt_token,
          status: row.status,
          userId: row.user_id,
          testId: row.test_id,
          testTitle: row.test_title,
        },
        section: {
          id: row.section_id,
          key: row.section_key,
          title: row.section_title,
          description: row.section_description,
          questionCount: row.question_count,
          timeLimitSeconds: row.time_limit_seconds ?? 120,
        },
        nextUrl: `/iq/attempt/${row.attempt_token}/phase/speed`,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      data: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger l'introduction rapidite depuis MySQL : ${message}`
          : "Impossible de charger l'introduction rapidite pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function completeIqAttempt(token: string): Promise<CompleteIqAttemptResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [attemptRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.id, a.attempt_token, a.status, a.user_id, a.test_id
       FROM iq_attempts a
       WHERE a.attempt_token = ?
       LIMIT 1`,
      [token]
    );
    const attempt = (attemptRows as { id: number; attempt_token: string; status: string; user_id: number | null; test_id: number }[])[0];

    if (!attempt) {
      return { completion: null, error: "Tentative de test de logique introuvable." };
    }

    const [totalRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) AS count
       FROM iq_questions q
       INNER JOIN iq_sections s ON s.id = q.section_id
       WHERE q.test_id = ? AND q.is_active = 1 AND s.is_active = 1`,
      [attempt.test_id]
    );
    const totalQuestions = (totalRows as CountRow[])[0]?.count ?? 0;

    const [aggregateRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT
          COUNT(DISTINCT aa.question_id) AS answered_questions,
          COALESCE(SUM(aa.points_earned), 0) AS raw_score,
          COALESCE(SUM(aa.points_earned), 0) AS weighted_score,
          ROUND(AVG(aa.response_time_ms)) AS average_response_time_ms,
          COALESCE(SUM(CASE WHEN s.section_key = 'speed' THEN aa.points_earned ELSE 0 END), 0) AS speed_score,
          COALESCE(SUM(CASE WHEN s.section_key = 'memory' THEN aa.points_earned ELSE 0 END), 0) AS memory_score,
          COALESCE(SUM(CASE WHEN s.section_key = 'verbal' THEN aa.points_earned ELSE 0 END), 0) AS verbal_score,
          COALESCE(SUM(CASE WHEN s.section_key = 'logic' THEN aa.points_earned ELSE 0 END), 0) AS logic_score,
          COALESCE(SUM(CASE WHEN s.section_key = 'spatial' THEN aa.points_earned ELSE 0 END), 0) AS spatial_score
       FROM iq_attempt_answers aa
       INNER JOIN iq_sections s ON s.id = aa.section_id
       WHERE aa.attempt_id = ?`,
      [attempt.id]
    );
    const aggregates = (aggregateRows as mysql.RowDataPacket[])[0] as {
      answered_questions: number;
      raw_score: string | number;
      weighted_score: string | number;
      average_response_time_ms: number | null;
      speed_score: string | number;
      memory_score: string | number;
      verbal_score: string | number;
      logic_score: string | number;
      spatial_score: string | number;
    };

    await connection.execute(
      `UPDATE iq_attempts
       SET status = 'completed',
           completed_at = COALESCE(completed_at, NOW()),
           total_questions = ?,
           answered_questions = ?,
           raw_score = ?,
           weighted_score = ?,
           estimated_iq_score = NULL,
           speed_score = ?,
           memory_score = ?,
           verbal_score = ?,
           logic_score = ?,
           spatial_score = ?,
           average_response_time_ms = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        totalQuestions,
        aggregates.answered_questions ?? 0,
        Number(aggregates.raw_score ?? 0),
        Number(aggregates.weighted_score ?? 0),
        Number(aggregates.speed_score ?? 0),
        Number(aggregates.memory_score ?? 0),
        Number(aggregates.verbal_score ?? 0),
        Number(aggregates.logic_score ?? 0),
        Number(aggregates.spatial_score ?? 0),
        aggregates.average_response_time_ms ?? null,
        attempt.id,
      ]
    );

    return {
      completion: {
        attemptToken: attempt.attempt_token,
        userAttached: Boolean(attempt.user_id),
        redirectUrl: attempt.user_id ? `/iq/results/${attempt.attempt_token}` : null,
        guestResultReady: !attempt.user_id,
      },
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      completion: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de finaliser la tentative de test de logique depuis MySQL : ${message}`
          : "Impossible de finaliser cette tentative pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function cleanupAbandonedIqAttempts(olderThanHours = ABANDONED_ATTEMPT_CLEANUP_HOURS): Promise<CleanupAbandonedIqAttemptsResult> {
  let connection: mysql.Connection | undefined;
  const safeOlderThanHours = Number.isInteger(olderThanHours) && olderThanHours > 0 ? olderThanHours : ABANDONED_ATTEMPT_CLEANUP_HOURS;

  try {
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const [answersResult] = await connection.execute<mysql.ResultSetHeader>(
      `DELETE aa
       FROM iq_attempt_answers aa
       INNER JOIN iq_attempts a ON a.id = aa.attempt_id
       WHERE a.status IN (?, ?)
         AND a.started_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [...CLEANUP_ABANDONED_ATTEMPT_STATUSES, safeOlderThanHours]
    );

    const [attemptsResult] = await connection.execute<mysql.ResultSetHeader>(
      `DELETE FROM iq_attempts
       WHERE status IN (?, ?)
         AND started_at < DATE_SUB(NOW(), INTERVAL ? HOUR)`,
      [...CLEANUP_ABANDONED_ATTEMPT_STATUSES, safeOlderThanHours]
    );

    await connection.commit();

    return {
      deletedAnswers: answersResult.affectedRows,
      deletedAttempts: attemptsResult.affectedRows,
      olderThanHours: safeOlderThanHours,
      statuses: CLEANUP_ABANDONED_ATTEMPT_STATUSES,
    };
  } catch (error) {
    await connection?.rollback();

    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      deletedAnswers: 0,
      deletedAttempts: 0,
      olderThanHours: safeOlderThanHours,
      statuses: CLEANUP_ABANDONED_ATTEMPT_STATUSES,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de nettoyer les tentatives QI abandonnees : ${message}`
          : "Impossible de nettoyer les tentatives QI abandonnees pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getIqResultByToken(token: string, userId: number): Promise<IqResultResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.attempt_token, a.test_id, t.title AS test_title, a.status, a.user_id, a.started_at, a.completed_at,
              a.total_questions, a.answered_questions, a.raw_score, a.weighted_score, a.estimated_iq_score,
              a.speed_score, a.memory_score, a.verbal_score, a.logic_score, a.spatial_score,
              a.average_response_time_ms
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       WHERE a.attempt_token = ?
       LIMIT 1`,
      [token]
    );
    const row = (rows as IqResultRow[])[0];

    if (!row) {
      return { result: null, error: "not-found" };
    }

    if (!row.user_id) {
      return { result: null, error: "unattached" };
    }

    if (row.user_id !== userId) {
      return { result: null, error: "forbidden" };
    }

    const [sectionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT s.section_key, s.title AS section_title, COALESCE(SUM(q.weight), 0) AS max_score
       FROM iq_sections s
       LEFT JOIN iq_questions q ON q.section_id = s.id AND q.is_active = 1
       WHERE s.test_id = ?
         AND s.is_active = 1
         AND s.section_key IN ('verbal', 'logic', 'spatial', 'memory', 'speed')
       GROUP BY s.section_key, s.title, s.position
       ORDER BY s.position ASC`,
      [row.test_id]
    );
    const sectionScoreByKey = {
      verbal: row.verbal_score === null ? 0 : Number(row.verbal_score),
      logic: row.logic_score === null ? 0 : Number(row.logic_score),
      spatial: row.spatial_score === null ? 0 : Number(row.spatial_score),
      memory: row.memory_score === null ? 0 : Number(row.memory_score),
      speed: row.speed_score === null ? 0 : Number(row.speed_score),
    };
    const sectionBreakdown = (sectionRows as IqSectionBreakdownRow[]).map((section) => {
      const key = section.section_key as keyof typeof sectionScoreByKey;
      const maxScore = Number(section.max_score);
      const score = sectionScoreByKey[key] ?? 0;

      return {
        key: section.section_key,
        label: section.section_title,
        score,
        maxScore,
        percentage: maxScore > 0 ? clampPercentage((score / maxScore) * 100) : 0,
      };
    });

    return {
      result: {
        attemptToken: row.attempt_token,
        testTitle: row.test_title,
        status: row.status,
        userId: row.user_id,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        totalQuestions: row.total_questions,
        answeredQuestions: row.answered_questions,
        rawScore: Number(row.raw_score),
        weightedScore: Number(row.weighted_score),
        estimatedIqScore: row.estimated_iq_score === null ? null : Number(row.estimated_iq_score),
        speedScore: row.speed_score === null ? null : Number(row.speed_score),
        memoryScore: row.memory_score === null ? null : Number(row.memory_score),
        verbalScore: row.verbal_score === null ? null : Number(row.verbal_score),
        logicScore: row.logic_score === null ? null : Number(row.logic_score),
        spatialScore: row.spatial_score === null ? null : Number(row.spatial_score),
        averageResponseTimeMs: row.average_response_time_ms,
        sectionBreakdown,
      },
    };
  } catch {
    return { result: null, error: "load-error" };
  } finally {
    await connection?.end();
  }
}

export async function getIqResultByTokenForEmail(token: string): Promise<IqResultResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT a.attempt_token, a.test_id, t.title AS test_title, a.status, a.user_id, a.started_at, a.completed_at,
              a.total_questions, a.answered_questions, a.raw_score, a.weighted_score, a.estimated_iq_score,
              a.speed_score, a.memory_score, a.verbal_score, a.logic_score, a.spatial_score,
              a.average_response_time_ms
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       WHERE a.attempt_token = ?
         AND a.status = 'completed'
       LIMIT 1`,
      [token]
    );
    const row = (rows as IqResultRow[])[0];

    if (!row) {
      return { result: null, error: "not-found" };
    }

    const [sectionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT s.section_key, s.title AS section_title, COALESCE(SUM(q.weight), 0) AS max_score
       FROM iq_sections s
       LEFT JOIN iq_questions q ON q.section_id = s.id AND q.is_active = 1
       WHERE s.test_id = ?
         AND s.is_active = 1
         AND s.section_key IN ('verbal', 'logic', 'spatial', 'memory', 'speed')
       GROUP BY s.section_key, s.title, s.position
       ORDER BY s.position ASC`,
      [row.test_id]
    );
    const sectionScoreByKey = {
      verbal: row.verbal_score === null ? 0 : Number(row.verbal_score),
      logic: row.logic_score === null ? 0 : Number(row.logic_score),
      spatial: row.spatial_score === null ? 0 : Number(row.spatial_score),
      memory: row.memory_score === null ? 0 : Number(row.memory_score),
      speed: row.speed_score === null ? 0 : Number(row.speed_score),
    };
    const sectionBreakdown = (sectionRows as IqSectionBreakdownRow[]).map((section) => {
      const key = section.section_key as keyof typeof sectionScoreByKey;
      const maxScore = Number(section.max_score);
      const score = sectionScoreByKey[key] ?? 0;

      return {
        key: section.section_key,
        label: section.section_title,
        score,
        maxScore,
        percentage: maxScore > 0 ? clampPercentage((score / maxScore) * 100) : 0,
      };
    });

    return {
      result: {
        attemptToken: row.attempt_token,
        testTitle: row.test_title,
        status: row.status,
        userId: row.user_id,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        totalQuestions: row.total_questions,
        answeredQuestions: row.answered_questions,
        rawScore: Number(row.raw_score),
        weightedScore: Number(row.weighted_score),
        estimatedIqScore: row.estimated_iq_score === null ? null : Number(row.estimated_iq_score),
        speedScore: row.speed_score === null ? null : Number(row.speed_score),
        memoryScore: row.memory_score === null ? null : Number(row.memory_score),
        verbalScore: row.verbal_score === null ? null : Number(row.verbal_score),
        logicScore: row.logic_score === null ? null : Number(row.logic_score),
        spatialScore: row.spatial_score === null ? null : Number(row.spatial_score),
        averageResponseTimeMs: row.average_response_time_ms,
        sectionBreakdown,
      },
    };
  } catch {
    return { result: null, error: "load-error" };
  } finally {
    await connection?.end();
  }
}
