import "server-only";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

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
  answers: IqDiagnosticAnswer[];
};

type IqDiagnosticRow = {
  attempt_id: number;
  attempt_token: string;
  status: string;
  test_title: string;
  email: string | null;
  pseudo: string | null;
  started_at: Date | null;
  completed_at: Date | null;
  total_questions: number | null;
  answered_questions: number | null;
  section_key: string | null;
  section_title: string | null;
  question_key: string | null;
  question_text: string | null;
  selected_option_key: string | null;
  selected_option_text: string | null;
  selected_position: number | null;
  correct_option_key: string | null;
  correct_option_text: string | null;
  correct_position: number | null;
  is_correct: number | null;
  points_earned: string | number | null;
  response_time_ms: number | null;
  answered_at: Date | null;
};

export async function getIqDiagnosticAttempts() {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT
          a.id AS attempt_id,
          a.attempt_token,
          a.status,
          t.title AS test_title,
          u.email,
          u.pseudo,
          a.started_at,
          a.completed_at,
          a.total_questions,
          a.answered_questions,
          s.section_key,
          s.title AS section_title,
          q.question_key,
          q.question_text,
          selected.option_key AS selected_option_key,
          selected.option_text AS selected_option_text,
          aa.selected_position,
          correct_option.option_key AS correct_option_key,
          correct_option.option_text AS correct_option_text,
          aa.correct_position,
          aa.is_correct,
          aa.points_earned,
          aa.response_time_ms,
          aa.answered_at
       FROM iq_attempts a
       INNER JOIN iq_tests t ON t.id = a.test_id
       LEFT JOIN users u ON u.id = a.user_id
       LEFT JOIN iq_attempt_answers aa ON aa.attempt_id = a.id
       LEFT JOIN iq_questions q ON q.id = aa.question_id
       LEFT JOIN iq_sections s ON s.id = aa.section_id
       LEFT JOIN iq_question_options selected ON selected.id = aa.selected_option_id
       LEFT JOIN iq_question_options correct_option
         ON correct_option.question_id = aa.question_id
        AND correct_option.is_correct = 1
        AND correct_option.is_active = 1
       WHERE u.email IS NOT NULL
         AND u.email <> ''
         AND (
           a.status = 'completed'
            OR EXISTS (
              SELECT 1
              FROM iq_attempt_answers aa_exists
              WHERE aa_exists.attempt_id = a.id
              LIMIT 1
            )
         )
       ORDER BY u.email ASC, a.started_at DESC, a.id DESC, s.position ASC, q.position ASC, aa.id ASC`
    );

    const attemptsById = new Map<number, IqDiagnosticAttempt>();

    for (const row of rows as IqDiagnosticRow[]) {
      const attempt =
        attemptsById.get(row.attempt_id) ??
        {
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
          answers: [],
        };

      if (row.section_key && !attempt.sections.includes(row.section_key)) {
        attempt.sections.push(row.section_key);
      }

      if (row.question_key || row.question_text) {
        attempt.answers.push({
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
          isCorrect: row.is_correct === null ? null : Number(row.is_correct) === 1,
          pointsEarned: Number(row.points_earned ?? 0),
          responseTimeMs: row.response_time_ms,
          answeredAt: row.answered_at,
        });
      }

      attemptsById.set(row.attempt_id, attempt);
    }

    return { attempts: Array.from(attemptsById.values()), error: null };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return { attempts: [], error: message };
  } finally {
    await connection?.end();
  }
}
