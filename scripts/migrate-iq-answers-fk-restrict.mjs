import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

// Migration : protege l'historique des tests passes.
//
// La table iq_attempt_answers referencait iq_questions(id) et iq_sections(id)
// avec ON DELETE CASCADE. Resultat : supprimer une question ou une section effacait
// silencieusement toutes les reponses historiques liees (perte de donnees).
//
// On passe ces deux contraintes en ON DELETE RESTRICT : toute tentative de suppression
// d'une question ou d'une section encore referencee par un test passe est desormais
// REFUSEE par la base, au lieu d'effacer l'historique. Reponses et temps sont ainsi
// definitivement figes, quelle que soit la modif faite sur les banques de Questions/Tests.
//
// Idempotent : ne fait rien si les contraintes sont deja en RESTRICT.

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

const TARGETS = [
  {
    constraint: "fk_iq_attempt_answers_question",
    column: "question_id",
    referencedTable: "iq_questions",
  },
  {
    constraint: "fk_iq_attempt_answers_section",
    column: "section_id",
    referencedTable: "iq_sections",
  },
];

async function getDeleteRule(connection, constraintName) {
  const [rows] = await connection.query(
    `SELECT DELETE_RULE
     FROM information_schema.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = 'iq_attempt_answers'
       AND CONSTRAINT_NAME = ?
     LIMIT 1`,
    [constraintName]
  );

  return rows.length > 0 ? String(rows[0].DELETE_RULE).toUpperCase() : null;
}

async function main() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    await connection.beginTransaction();

    for (const target of TARGETS) {
      const currentRule = await getDeleteRule(connection, target.constraint);

      if (currentRule === null) {
        console.warn(`! Contrainte ${target.constraint} introuvable, ignoree.`);
        continue;
      }

      if (currentRule === "RESTRICT" || currentRule === "NO ACTION") {
        console.log(`= ${target.constraint} deja en ${currentRule}, rien a faire.`);
        continue;
      }

      await connection.query(
        `ALTER TABLE iq_attempt_answers DROP FOREIGN KEY ${target.constraint}`
      );
      await connection.query(
        `ALTER TABLE iq_attempt_answers
           ADD CONSTRAINT ${target.constraint}
           FOREIGN KEY (${target.column}) REFERENCES ${target.referencedTable} (id)
           ON DELETE RESTRICT`
      );

      console.log(`+ ${target.constraint} : ${currentRule} -> RESTRICT.`);
    }

    await connection.commit();
    console.log("Migration FK terminee.");
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
