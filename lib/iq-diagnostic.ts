import "server-only";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

export type IqDiagnosticAnswerSource = "recorded" | "expected_missing";

export type IqDiagnosticAnswer = {
  attemptId: number;
  attemptToken: string;
  status: string;
  testTitle: string;
  email: string | null;
  pseudo: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  totalQuestions: number;
  answeredQuestions: number;
  sectionKey: string | null;
  sectionTitle: string | null;
  questionKey: string | null;
  questionText: string | null;
  selectedOptionKey: string | null;
  selectedOptionText: string | null;
  selectedPosition: number | null;
  correctOptionKey: string | null;
  correctOptionText: string | null;
  correctPosition: number | null;
  isCorrect: boolean | null;
  pointsEarned: number;
  responseTimeMs: number | null;
  answeredAt: Date | null;
  source: IqDiagnosticAnswerSource;
  sequenceIndex: number | null;
};

export type IqDiagnosticAttempt = {
  attemptId: number;
  attemptToken: string;
  status: string;
  testTitle: string;
  email: string | null;
  pseudo: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  totalQuestions: number;
  answeredQuestions: number;
  sections: string[];
  sectionCounts: Record<string, number>;
  expectedSectionCounts: Record<string, number>;
  sectionScores: Record<string, number | null>;
  answers: IqDiagnosticAnswer[];
};

type AttemptRow = {
  attempt_id: number;
  test_id: number;
  question_bank_test_id: number | null;
  attempt_token: string;
  status: string;
  test_title: string;
  email: string | null;
  pseudo: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  total_questions: number | null;
  answered_questions: number | null;
  resolved_sequence_definition: string | null;
  verbal_score: string | number | null;
  logic_score: string | number | null;
  spatial_score: string | number | null;
  quantitative_score: string | number | null;
  long_memory_score: string | number | null;
  memory_score: string | number | null;
  audio_memory_score: string | number | null;
  speed_score: string | number | null;
};

type AnswerRow = {
  attempt_id: number;
  question_id: number | null;
  section_key: string | null;
  section_title: string | null;
  question_key: string | null;
  question_text: string | null;
  question_format: string | null;
  weight: string | number | null;
  selected_option_id: number | null;
  selected_option_key: string | null;
  selected_option_text: string | null;
  selected_position: number | null;
  current_correct_option_id: number | null;
  correct_option_key: string | null;
  correct_option_text: string | null;
  correct_position: number | null;
  response_time_ms: number | null;
  answered_at: Date | null;
};

type QuestionRow = {
  test_id: number;
  section_key: string | null;
  section_title: string | null;
  question_key: string;
  question_text: string | null;
  correct_option_key: string | null;
  correct_option_text: string | null;
};

type ExpectedQuestion = {
  questionKey: string;
  sequenceIndex: number;
};

type SequenceObject = Record<string, unknown>;

function parseJsonObject(value: string | null): SequenceObject | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as SequenceObject) : null;
  } catch {
    return null;
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function addQuestionKey(list: ExpectedQuestion[], seen: Set<string>, questionKey: unknown) {
  const cleanQuestionKey = stringValue(questionKey);

  if (!cleanQuestionKey || seen.has(cleanQuestionKey)) return;

  seen.add(cleanQuestionKey);
  list.push({ questionKey: cleanQuestionKey, sequenceIndex: list.length + 1 });
}

function addChoiceQuestionKeys(list: ExpectedQuestion[], seen: Set<string>, rawChoices: unknown) {
  if (!Array.isArray(rawChoices)) return;

  for (const rawChoice of rawChoices) {
    if (!rawChoice || typeof rawChoice !== "object") continue;
    addQuestionKey(list, seen, (rawChoice as SequenceObject).questionKey);
  }
}

function addMemoryItemQuestionKeys(list: ExpectedQuestion[], seen: Set<string>, rawItems: unknown) {
  if (!Array.isArray(rawItems)) return;

  for (const rawItem of rawItems) {
    if (!rawItem || typeof rawItem !== "object") continue;

    const item = rawItem as SequenceObject;
    addQuestionKey(list, seen, item.questionKey);
    addChoiceQuestionKeys(list, seen, item.choices);
  }
}

function extractExpectedQuestions(resolvedSequenceDefinition: string | null): ExpectedQuestion[] {
  const sequence = parseJsonObject(resolvedSequenceDefinition);
  const expectedQuestions: ExpectedQuestion[] = [];
  const seen = new Set<string>();

  if (!sequence) return expectedQuestions;

  const longMemory = sequence.longMemory;
  if (longMemory && typeof longMemory === "object") {
    addMemoryItemQuestionKeys(expectedQuestions, seen, (longMemory as SequenceObject).items);
  }

  if (!Array.isArray(sequence.steps)) return expectedQuestions;

  for (const rawStep of sequence.steps) {
    if (!rawStep || typeof rawStep !== "object") continue;

    const step = rawStep as SequenceObject;
    addQuestionKey(expectedQuestions, seen, step.questionKey);
    addChoiceQuestionKeys(expectedQuestions, seen, step.choices);
    addMemoryItemQuestionKeys(expectedQuestions, seen, step.items);

    if (Array.isArray(step.questions)) {
      for (const rawQuestion of step.questions) {
        if (!rawQuestion || typeof rawQuestion !== "object") continue;
        addQuestionKey(expectedQuestions, seen, (rawQuestion as SequenceObject).questionKey);
      }
    }

    if (Array.isArray(step.questionKeys)) {
      for (const questionKey of step.questionKeys) {
        addQuestionKey(expectedQuestions, seen, questionKey);
      }
    }
  }

  return expectedQuestions;
}

function numberOrNull(value: string | number | null) {
  return value === null ? null : Number(value);
}

function isOverlayFormat(questionFormat: string | null) {
  return questionFormat === "visual_overlay" || questionFormat === "spatial_overlay";
}

function makeAttempt(row: AttemptRow): IqDiagnosticAttempt {
  return {
    attemptId: row.attempt_id,
    attemptToken: row.attempt_token,
    status: row.status,
    testTitle: row.test_title,
    email: row.email,
    pseudo: row.pseudo,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    totalQuestions: Number(row.total_questions ?? 0),
    answeredQuestions: Number(row.answered_questions ?? 0),
    sections: [],
    sectionCounts: {},
    expectedSectionCounts: {},
    sectionScores: {
      verbal: numberOrNull(row.verbal_score),
      logic: numberOrNull(row.logic_score),
      spatial: numberOrNull(row.spatial_score),
      quantitative: numberOrNull(row.quantitative_score),
      long_memory: numberOrNull(row.long_memory_score),
      memory: numberOrNull(row.memory_score),
      audio_memory: numberOrNull(row.audio_memory_score),
      speed: numberOrNull(row.speed_score),
    },
    answers: [],
  };
}

function baseAnswer(attempt: IqDiagnosticAttempt): Omit<IqDiagnosticAnswer, "source" | "sequenceIndex"> {
  return {
    attemptId: attempt.attemptId,
    attemptToken: attempt.attemptToken,
    status: attempt.status,
    testTitle: attempt.testTitle,
    email: attempt.email,
    pseudo: attempt.pseudo,
    startedAt: attempt.startedAt,
    completedAt: attempt.completedAt,
    totalQuestions: attempt.totalQuestions,
    answeredQuestions: attempt.answeredQuestions,
    sectionKey: null,
    sectionTitle: null,
    questionKey: null,
    questionText: null,
    selectedOptionKey: null,
    selectedOptionText: null,
    selectedPosition: null,
    correctOptionKey: null,
    correctOptionText: null,
    correctPosition: null,
    isCorrect: null,
    pointsEarned: 0,
    responseTimeMs: null,
    answeredAt: null,
  };
}

export async function getIqDiagnosticAttempts() {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [attemptRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT
          a.id AS attempt_id,
          a.test_id,
          t.question_bank_test_id,
          a.attempt_token,
          a.status,
          t.title AS test_title,
          COALESCE(u.email, rel.email) AS email,
          u.pseudo,
          a.started_at,
          a.completed_at,
          a.total_questions,
          a.answered_questions,
          a.resolved_sequence_definition,
          a.verbal_score,
          a.logic_score,
          a.spatial_score,
          a.quantitative_score,
          a.long_memory_score,
          a.memory_score,
          a.audio_memory_score,
          a.speed_score
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN (
         SELECT result_token, MIN(email) AS email
         FROM result_email_links
         WHERE result_type = 'iq'
         GROUP BY result_token
       ) rel ON rel.result_token = a.attempt_token
       WHERE COALESCE(u.email, rel.email) IS NOT NULL
         AND COALESCE(u.email, rel.email) <> ''
         AND (
           a.status = 'completed'
            OR EXISTS (
              SELECT 1
              FROM iq_attempt_answers aa_exists
              WHERE aa_exists.attempt_id = a.id
              LIMIT 1
            )
         )
       ORDER BY COALESCE(u.email, rel.email) ASC, a.started_at DESC, a.id DESC`
    );

    const rows = attemptRows as AttemptRow[];
    const attemptsById = new Map<number, IqDiagnosticAttempt>();
    const expectedByAttemptId = new Map<number, ExpectedQuestion[]>();
    const attemptIds = rows.map((row) => row.attempt_id);
    const testIds = Array.from(
      new Set(rows.flatMap((row) => [row.test_id, row.question_bank_test_id]).filter((testId): testId is number => testId !== null))
    );

    for (const row of rows) {
      attemptsById.set(row.attempt_id, makeAttempt(row));
      expectedByAttemptId.set(row.attempt_id, extractExpectedQuestions(row.resolved_sequence_definition));
    }

    if (attemptIds.length === 0) {
      return { attempts: [], error: null };
    }

    const attemptPlaceholders = attemptIds.map(() => "?").join(", ");
    const [answerRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT
          aa.attempt_id,
          aa.question_id,
          s.section_key,
          s.title AS section_title,
          q.question_key,
          q.question_text,
          q.question_format,
          q.weight,
          aa.selected_option_id,
          selected.option_key AS selected_option_key,
          selected.option_text AS selected_option_text,
          aa.selected_position,
          correct_option.id AS current_correct_option_id,
          correct_option.option_key AS correct_option_key,
          correct_option.option_text AS correct_option_text,
          COALESCE(overlay.correct_position, correct_option.position) AS correct_position,
          aa.response_time_ms,
          aa.answered_at
       FROM iq_attempt_answers aa
       LEFT JOIN iq_questions q ON q.id = aa.question_id
       LEFT JOIN iq_sections s ON s.id = aa.section_id
       LEFT JOIN iq_spatial_overlay_questions overlay ON overlay.question_id = q.id AND overlay.is_active = 1
       LEFT JOIN iq_question_options selected ON selected.id = aa.selected_option_id
       LEFT JOIN iq_question_options correct_option
         ON correct_option.question_id = aa.question_id
        AND correct_option.is_correct = 1
        AND correct_option.is_active = 1
       WHERE aa.attempt_id IN (${attemptPlaceholders})
       ORDER BY aa.attempt_id ASC, s.position ASC, q.position ASC, aa.id ASC`,
      attemptIds
    );

    const recordedQuestionKeysByAttempt = new Map<number, Set<string>>();

    for (const row of answerRows as AnswerRow[]) {
      const attempt = attemptsById.get(row.attempt_id);
      if (!attempt) continue;

      const isCorrect = isOverlayFormat(row.question_format)
        ? row.selected_position !== null && row.correct_position !== null && row.selected_position === row.correct_position
        : row.selected_option_id !== null &&
          row.current_correct_option_id !== null &&
          row.selected_option_id === row.current_correct_option_id;
      const pointsEarned = isCorrect ? Number(row.weight ?? 0) : 0;

      if (row.section_key) {
        attempt.sectionCounts[row.section_key] = (attempt.sectionCounts[row.section_key] ?? 0) + 1;
        if (!attempt.sections.includes(row.section_key)) {
          attempt.sections.push(row.section_key);
        }
      }

      if (row.question_key) {
        const recordedKeys = recordedQuestionKeysByAttempt.get(row.attempt_id) ?? new Set<string>();
        recordedKeys.add(row.question_key);
        recordedQuestionKeysByAttempt.set(row.attempt_id, recordedKeys);
      }

      attempt.answers.push({
        ...baseAnswer(attempt),
        sectionKey: row.section_key,
        sectionTitle: row.section_title,
        questionKey: row.question_key,
        questionText: row.question_text,
        selectedOptionKey: row.selected_option_key,
        selectedOptionText: row.selected_option_text,
        selectedPosition: row.selected_position,
        correctOptionKey: row.correct_option_key,
        correctOptionText: row.correct_option_text,
        correctPosition: row.correct_position,
        isCorrect,
        pointsEarned,
        responseTimeMs: row.response_time_ms,
        answeredAt: row.answered_at,
        source: "recorded",
        sequenceIndex: null,
      });
    }

    const questionsByTestAndKey = new Map<string, QuestionRow>();

    if (testIds.length > 0) {
      const testPlaceholders = testIds.map(() => "?").join(", ");
      const [questionRows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT
            q.test_id,
            s.section_key,
            s.title AS section_title,
            q.question_key,
            q.question_text,
            correct_option.option_key AS correct_option_key,
            correct_option.option_text AS correct_option_text
         FROM iq_questions q
         LEFT JOIN iq_sections s ON s.id = q.section_id
         LEFT JOIN iq_question_options correct_option
           ON correct_option.question_id = q.id
          AND correct_option.is_correct = 1
          AND correct_option.is_active = 1
         WHERE q.test_id IN (${testPlaceholders})
         ORDER BY s.position ASC, q.position ASC, q.id ASC`,
        testIds
      );

      for (const row of questionRows as QuestionRow[]) {
        questionsByTestAndKey.set(`${row.test_id}:${row.question_key}`, row);
      }
    }

    for (const row of rows) {
      const attempt = attemptsById.get(row.attempt_id);
      if (!attempt) continue;

      const recordedKeys = recordedQuestionKeysByAttempt.get(row.attempt_id) ?? new Set<string>();
      const expectedQuestions = expectedByAttemptId.get(row.attempt_id) ?? [];

      for (const expectedQuestion of expectedQuestions) {
        const question =
          questionsByTestAndKey.get(`${row.question_bank_test_id ?? row.test_id}:${expectedQuestion.questionKey}`) ??
          questionsByTestAndKey.get(`${row.test_id}:${expectedQuestion.questionKey}`);
        const sectionKey = question?.section_key ?? null;

        if (sectionKey) {
          attempt.expectedSectionCounts[sectionKey] = (attempt.expectedSectionCounts[sectionKey] ?? 0) + 1;
          if (!attempt.sections.includes(sectionKey)) {
            attempt.sections.push(sectionKey);
          }
        }

        if (recordedKeys.has(expectedQuestion.questionKey)) continue;

        attempt.answers.push({
          ...baseAnswer(attempt),
          sectionKey,
          sectionTitle: question?.section_title ?? null,
          questionKey: expectedQuestion.questionKey,
          questionText: question?.question_text ?? null,
          correctOptionKey: question?.correct_option_key ?? null,
          correctOptionText: question?.correct_option_text ?? null,
          source: "expected_missing",
          sequenceIndex: expectedQuestion.sequenceIndex,
        });
      }

      attempt.answers.sort((a, b) => {
        const aIndex = a.sequenceIndex ?? 9999;
        const bIndex = b.sequenceIndex ?? 9999;
        if (aIndex !== bIndex) return aIndex - bIndex;

        return (a.questionKey ?? "").localeCompare(b.questionKey ?? "");
      });
    }

    return { attempts: Array.from(attemptsById.values()), error: null };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return { attempts: [], error: message };
  } finally {
    await connection?.end();
  }
}
