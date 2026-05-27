import "server-only";
import crypto from "crypto";
import mysql from "mysql2/promise";

export type IqAdminQuestionStat = {
  id: number;
  sectionTitle: string;
  sectionKey: string;
  questionKey: string | null;
  questionText: string | null;
  questionImageUrl: string | null;
  questionFormat: string;
  weight: number;
  displayedCount: number;
  correctCount: number;
  incorrectCount: number;
  averageResponseTimeMs: number | null;
};

export type IqAdminStats = {
  registeredPlayers: number;
  completedIqTests: number;
  questions: IqAdminQuestionStat[];
};

const ADMIN_USERNAME = "Wildspark";
const ADMIN_PASSWORD = "AdminWildspark";
const ADMIN_COOKIE_NAME = "brainspark_admin_session";
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 12;

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

type CountRow = {
  count: number;
};

type QuestionStatRow = {
  id: number;
  section_title: string;
  section_key: string;
  question_key: string | null;
  question_text: string | null;
  question_image_url: string | null;
  question_format: string;
  weight: string | number;
  displayed_count: number;
  correct_count: string | number;
  incorrect_count: string | number;
  average_response_time_ms: number | null;
};

function adminCookieValue() {
  return crypto.createHash("sha256").update(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}:brainspark-admin`).digest("hex");
}

export function getAdminAuthCookie() {
  return {
    name: ADMIN_COOKIE_NAME,
    value: adminCookieValue(),
    maxAge: ADMIN_COOKIE_MAX_AGE,
  };
}

export function isAdminLoginValid(username: string, password: string) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function isAdminSessionValid(cookieValue: string | undefined) {
  return cookieValue === adminCookieValue();
}

export async function getIqAdminStats(): Promise<IqAdminStats> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [userRows] = await connection.execute<mysql.RowDataPacket[]>("SELECT COUNT(*) AS count FROM users WHERE is_active = 1");
    const [completedRows] = await connection.execute<mysql.RowDataPacket[]>(
      "SELECT COUNT(*) AS count FROM iq_attempts WHERE status = 'completed'"
    );
    const [questionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT q.id,
              s.title AS section_title,
              s.section_key,
              q.question_key,
              q.question_text,
              q.question_image_url,
              q.question_format,
              q.weight,
              COUNT(aa.id) AS displayed_count,
              COALESCE(SUM(CASE WHEN aa.is_correct = 1 THEN 1 ELSE 0 END), 0) AS correct_count,
              COALESCE(SUM(CASE WHEN aa.is_correct = 0 THEN 1 ELSE 0 END), 0) AS incorrect_count,
              ROUND(AVG(aa.response_time_ms)) AS average_response_time_ms
       FROM iq_questions q
       INNER JOIN iq_sections s ON s.id = q.section_id
       LEFT JOIN iq_attempt_answers aa ON aa.question_id = q.id
       WHERE q.is_active = 1
       GROUP BY q.id, s.title, s.section_key, q.question_key, q.question_text, q.question_image_url, q.question_format, q.weight, q.position
       ORDER BY s.position ASC, q.position ASC, q.id ASC`
    );

    return {
      registeredPlayers: Number((userRows as CountRow[])[0]?.count ?? 0),
      completedIqTests: Number((completedRows as CountRow[])[0]?.count ?? 0),
      questions: (questionRows as QuestionStatRow[]).map((row) => ({
        id: Number(row.id),
        sectionTitle: row.section_title,
        sectionKey: row.section_key,
        questionKey: row.question_key,
        questionText: row.question_text,
        questionImageUrl: row.question_image_url,
        questionFormat: row.question_format,
        weight: Number(row.weight),
        displayedCount: Number(row.displayed_count),
        correctCount: Number(row.correct_count),
        incorrectCount: Number(row.incorrect_count),
        averageResponseTimeMs: row.average_response_time_ms === null ? null : Number(row.average_response_time_ms),
      })),
    };
  } finally {
    await connection?.end();
  }
}

export async function updateIqQuestionWeight(questionId: number, weight: number) {
  let connection: mysql.Connection | undefined;

  try {
    if (!Number.isInteger(questionId) || questionId <= 0 || !Number.isFinite(weight) || weight <= 0 || weight > 100) {
      return { ok: false, error: "Valeur de points invalide." };
    }

    connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute<mysql.ResultSetHeader>(
      "UPDATE iq_questions SET weight = ? WHERE id = ? AND is_active = 1",
      [weight, questionId]
    );

    if (result.affectedRows === 0) {
      return { ok: false, error: "Question introuvable." };
    }

    return { ok: true, error: null };
  } finally {
    await connection?.end();
  }
}
