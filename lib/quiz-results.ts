import "server-only";
import mysql from "mysql2/promise";

export type QuizTopicResultInput = {
  topicId: number;
  sessionId?: number | null;
  userId?: number | null;
  playerName?: string | null;
  resultToken: string;
  score: number;
  totalQuestions: number;
  durationSeconds?: number | null;
  percentage: number;
};

export type QuizTopicResultRow = {
  id: number;
  result_token: string;
  topic_title: string;
  topic_slug: string;
  topic_image_url: string | null;
  category_name: string;
  player_name: string;
  player_avatar: string | null;
  user_id: number | null;
  score: number;
  total_questions: number;
  duration_seconds: number | null;
  percentage: number;
  created_at: Date;
};

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

export async function getQuizResultsConnection() {
  return mysql.createConnection(dbConfig);
}

export async function ensureQuizTopicResultsTable(connection: mysql.Connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS quiz_topic_results (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      topic_id INT UNSIGNED NOT NULL,
      session_id INT UNSIGNED NULL,
      user_id INT UNSIGNED NULL,
      player_name VARCHAR(120) NOT NULL DEFAULT 'Invité',
      result_token VARCHAR(120) NOT NULL,
      score INT UNSIGNED NOT NULL,
      total_questions INT UNSIGNED NOT NULL,
      duration_seconds INT UNSIGNED NULL,
      percentage DECIMAL(5,2) NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_quiz_topic_results_result_token (result_token),
      UNIQUE KEY uq_quiz_topic_results_session_id (session_id),
      KEY idx_quiz_topic_results_topic_id (topic_id),
      KEY idx_quiz_topic_results_user_id (user_id),
      KEY idx_quiz_topic_results_created_at (created_at)
    )
  `);
}

export async function insertQuizTopicResult(connection: mysql.Connection, input: QuizTopicResultInput) {
  await ensureQuizTopicResultsTable(connection);

  await connection.execute(
    `INSERT INTO quiz_topic_results (
       topic_id,
       session_id,
       user_id,
       player_name,
       result_token,
       score,
       total_questions,
       duration_seconds,
       percentage
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       topic_id = VALUES(topic_id),
       session_id = VALUES(session_id),
       user_id = VALUES(user_id),
       player_name = VALUES(player_name),
       score = VALUES(score),
       total_questions = VALUES(total_questions),
       duration_seconds = VALUES(duration_seconds),
       percentage = VALUES(percentage)`,
    [
      input.topicId,
      input.sessionId ?? null,
      input.userId ?? null,
      input.playerName?.trim() || "Invité",
      input.resultToken,
      input.score,
      input.totalQuestions,
      input.durationSeconds ?? null,
      input.percentage,
    ]
  );
}

export async function getQuizTopicResultByToken(connection: mysql.Connection, resultToken: string, userId?: number | null) {
  await ensureQuizTopicResultsTable(connection);

  const userClause = userId === undefined ? "" : "AND r.user_id = ?";
  const params = userId === undefined ? [resultToken] : [resultToken, userId];
  const [rows] = await connection.execute<mysql.RowDataPacket[]>(
    `SELECT
       r.id,
       r.result_token,
       t.name AS topic_title,
       t.slug AS topic_slug,
       t.image_url AS topic_image_url,
       c.name AS category_name,
       COALESCE(u.pseudo, r.player_name, 'Invité') AS player_name,
       u.avatar_url AS player_avatar,
       r.user_id,
       r.score,
       r.total_questions,
       r.duration_seconds,
       r.percentage,
       r.created_at
     FROM quiz_topic_results r
     INNER JOIN quiz_topics t ON t.id = r.topic_id
     INNER JOIN quiz_categories c ON c.id = t.category_id
     LEFT JOIN users u ON u.id = r.user_id
     WHERE r.result_token = ?
       ${userClause}
     LIMIT 1`,
    params
  );

  return (rows as QuizTopicResultRow[])[0] ?? null;
}

export async function attachQuizTopicResultToUser(connection: mysql.Connection, resultToken: string, userId: number, pseudo: string) {
  await ensureQuizTopicResultsTable(connection);

  await connection.execute(
    `UPDATE quiz_topic_results
     SET user_id = ?, player_name = ?
     WHERE result_token = ? AND user_id IS NULL`,
    [userId, pseudo, resultToken]
  );
}

