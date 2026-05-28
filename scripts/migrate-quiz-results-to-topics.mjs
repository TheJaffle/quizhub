import mysql from "mysql2/promise";

const apply = process.argv.includes("--apply");

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

async function ensureQuizTopicResultsTable(connection) {
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

async function migrateFinishedSessions(connection) {
  const [rows] = await connection.execute(`
    SELECT COUNT(*) AS count
    FROM quiz_sessions
    WHERE status = 'finished'
      AND result_token IS NOT NULL
  `);

  if (!apply) return Number(rows[0]?.count ?? 0);

  const [result] = await connection.execute(`
    INSERT INTO quiz_topic_results (
      topic_id,
      session_id,
      user_id,
      player_name,
      result_token,
      score,
      total_questions,
      duration_seconds,
      percentage,
      created_at
    )
    SELECT
      s.topic_id,
      s.id,
      s.user_id,
      COALESCE(u.pseudo, 'Invité'),
      s.result_token,
      COALESCE(s.score, 0),
      s.total_questions,
      NULL,
      COALESCE(s.percentage, 0),
      COALESCE(s.finished_at, s.created_at)
    FROM quiz_sessions s
    LEFT JOIN users u ON u.id = s.user_id
    WHERE s.status = 'finished'
      AND s.result_token IS NOT NULL
    ON DUPLICATE KEY UPDATE
      topic_id = VALUES(topic_id),
      session_id = VALUES(session_id),
      user_id = VALUES(user_id),
      player_name = VALUES(player_name),
      score = VALUES(score),
      total_questions = VALUES(total_questions),
      percentage = VALUES(percentage)
  `);

  return result.affectedRows;
}

async function migrateLegacyResults(connection) {
  const [rows] = await connection.execute(`
    SELECT COUNT(*) AS count
    FROM quiz_results qr
    INNER JOIN quizzes q ON q.id = qr.quiz_id
    LEFT JOIN (
      SELECT
        CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(qb.question_key, '-', 3), '-', -1) AS UNSIGNED) AS legacy_quiz_id,
        MIN(qb.topic_id) AS topic_id
      FROM question_bank qb
      WHERE qb.question_key LIKE 'legacy-quiz-%-question-%'
      GROUP BY legacy_quiz_id
    ) legacy_topic ON legacy_topic.legacy_quiz_id = q.id
    LEFT JOIN quiz_topics slug_topic ON slug_topic.slug = q.slug
    LEFT JOIN quiz_topics synthetic_topic ON q.slug = CONCAT(synthetic_topic.slug, '-', LOWER(q.difficulty))
    WHERE COALESCE(legacy_topic.topic_id, slug_topic.id, synthetic_topic.id) IS NOT NULL
      AND qr.result_token IS NOT NULL
  `);

  if (!apply) return Number(rows[0]?.count ?? 0);

  const [result] = await connection.execute(`
    INSERT INTO quiz_topic_results (
      topic_id,
      session_id,
      user_id,
      player_name,
      result_token,
      score,
      total_questions,
      duration_seconds,
      percentage,
      created_at
    )
    SELECT
      COALESCE(legacy_topic.topic_id, slug_topic.id, synthetic_topic.id) AS topic_id,
      NULL,
      qr.user_id,
      qr.player_name,
      qr.result_token,
      qr.score,
      qr.total_questions,
      qr.duration_seconds,
      qr.percentage,
      qr.created_at
    FROM quiz_results qr
    INNER JOIN quizzes q ON q.id = qr.quiz_id
    LEFT JOIN (
      SELECT
        CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(qb.question_key, '-', 3), '-', -1) AS UNSIGNED) AS legacy_quiz_id,
        MIN(qb.topic_id) AS topic_id
      FROM question_bank qb
      WHERE qb.question_key LIKE 'legacy-quiz-%-question-%'
      GROUP BY legacy_quiz_id
    ) legacy_topic ON legacy_topic.legacy_quiz_id = q.id
    LEFT JOIN quiz_topics slug_topic ON slug_topic.slug = q.slug
    LEFT JOIN quiz_topics synthetic_topic ON q.slug = CONCAT(synthetic_topic.slug, '-', LOWER(q.difficulty))
    WHERE COALESCE(legacy_topic.topic_id, slug_topic.id, synthetic_topic.id) IS NOT NULL
      AND qr.result_token IS NOT NULL
    ON DUPLICATE KEY UPDATE
      topic_id = VALUES(topic_id),
      user_id = VALUES(user_id),
      player_name = VALUES(player_name),
      score = VALUES(score),
      total_questions = VALUES(total_questions),
      duration_seconds = VALUES(duration_seconds),
      percentage = VALUES(percentage)
  `);

  return result.affectedRows;
}

async function main() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    await ensureQuizTopicResultsTable(connection);
    const sessions = await migrateFinishedSessions(connection);
    const legacy = await migrateLegacyResults(connection);

    console.log(apply ? "Migration appliquee." : "Dry-run uniquement. Relancer avec --apply pour ecrire en base.");
    console.log(`Sessions terminees detectees: ${sessions}`);
    console.log(`Anciens resultats quiz mappables: ${legacy}`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("Impossible de migrer les resultats de quiz vers les themes.");
  console.error(error);
  process.exit(1);
});
