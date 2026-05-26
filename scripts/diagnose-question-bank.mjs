import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

loadEnvFile(path.join(rootDir, ".env.local"));
loadEnvFile(path.join(rootDir, ".env"));

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = line.slice(0, equalsIndex).trim();
    const value = line.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function formatCount(value) {
  return String(Number(value ?? 0)).padStart(2, " ");
}

let connection;

try {
  connection = await mysql.createConnection(dbConfig);

  const [rows] = await connection.execute(
    `SELECT
       c.name AS category_name,
       t.name AS topic_name,
       t.slug AS topic_slug,
       SUM(CASE WHEN qb.difficulty = 'Easy' AND qb.is_active = 1 THEN 1 ELSE 0 END) AS easy_count,
       SUM(CASE WHEN qb.difficulty = 'Medium' AND qb.is_active = 1 THEN 1 ELSE 0 END) AS medium_count,
       SUM(CASE WHEN qb.difficulty = 'Hard' AND qb.is_active = 1 THEN 1 ELSE 0 END) AS hard_count,
       COUNT(qb.id) AS total_count
     FROM quiz_topics t
     INNER JOIN quiz_categories c ON c.id = t.category_id
     LEFT JOIN question_bank qb ON qb.topic_id = t.id
     WHERE t.is_active = 1
     GROUP BY t.id, c.name, t.name, t.slug
     ORDER BY c.name ASC, t.name ASC`
  );

  console.log("Diagnostic banque de questions classique");
  console.log("Aucune table QI ni ancienne table quiz fixe n'est lue par ce diagnostic.");
  console.log("");

  const alerts = [];

  for (const row of rows) {
    const easy = Number(row.easy_count ?? 0);
    const medium = Number(row.medium_count ?? 0);
    const hard = Number(row.hard_count ?? 0);

    console.log(
      `${row.category_name} > ${row.topic_name} (${row.topic_slug}) | Easy ${formatCount(easy)} | Medium ${formatCount(medium)} | Hard ${formatCount(hard)} | Total ${formatCount(row.total_count)}`
    );

    for (const [label, count] of [
      ["Easy", easy],
      ["Medium", medium],
      ["Hard", hard],
    ]) {
      if (count < 20) {
        alerts.push(`${row.topic_name} ${label} : ${count} question${count > 1 ? "s" : ""}`);
      }
    }
  }

  console.log("");
  console.log("Alertes contenu");

  if (alerts.length === 0) {
    console.log("- Aucun trou detecte : tous les niveaux actifs ont au moins 20 questions.");
  } else {
    for (const alert of alerts) {
      console.log(`- ${alert}`);
    }
  }
} catch (error) {
  console.error("Impossible de lancer le diagnostic question_bank.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await connection?.end();
}
