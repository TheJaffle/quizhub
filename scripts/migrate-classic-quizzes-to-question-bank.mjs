import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const apply = process.argv.includes("--apply");

loadEnvFile(path.join(rootDir, ".env.local"));
loadEnvFile(path.join(rootDir, ".env"));

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
  multipleStatements: false,
};

const difficultyLabels = {
  Easy: ["easy", "facile", "debutant", "débutant"],
  Medium: ["medium", "medium", "meduim", "moyen", "moyenne", "intermediaire", "intermediaire"],
  Hard: ["hard", "difficile", "expert", "avance", "avancé"],
};

const topicStopWords = new Set([
  "quiz",
  "qcm",
  "test",
  "question",
  "questions",
  "20",
  "easy",
  "facile",
  "medium",
  "meduim",
  "moyen",
  "moyenne",
  "hard",
  "difficile",
  "debutant",
  "intermediaire",
  "expert",
  "avance",
]);

const preferredTopicNamesBySlug = new Map([
  ["culture-generale", "Culture générale"],
  ["dates-a-connaitre", "Dates à connaître"],
  ["mathematiques", "Mathématiques"],
  ["geographie", "Géographie"],
  ["sante", "Santé"],
  ["cinema", "Cinéma"],
  ["orthographe-francaise", "Orthographe française"],
  ["electricite", "Électricité"],
]);

const preferredTopicSlugsByDetectedSlug = new Map([
  ["culture", "culture-generale"],
  ["maths", "mathematiques"],
]);

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

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(value) {
  return normalizeText(value)
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function titleCaseFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function topicSlugFromSource(value) {
  const parts = slugify(value)
    .split("-")
    .filter((part) => part && !topicStopWords.has(part) && !/^\d+$/.test(part));

  return parts.join("-");
}

function detectDifficulty(quiz) {
  if (["Easy", "Medium", "Hard"].includes(quiz.difficulty)) {
    return quiz.difficulty;
  }

  const source = normalizeText(`${quiz.slug} ${quiz.title}`);

  for (const [difficulty, labels] of Object.entries(difficultyLabels)) {
    if (labels.some((label) => source.includes(label))) {
      return difficulty;
    }
  }

  return null;
}

function detectTopicName(quiz) {
  const topicSlug = topicSlugFromSource(quiz.slug) || topicSlugFromSource(quiz.title);
  const preferredSlug = preferredTopicSlugsByDetectedSlug.get(topicSlug) ?? topicSlug;

  if (preferredTopicNamesBySlug.has(preferredSlug)) {
    return preferredTopicNamesBySlug.get(preferredSlug);
  }

  return titleCaseFromSlug(preferredSlug) || quiz.category_name || "Quiz";
}

function detectTopicSlug(quiz) {
  const detectedSlug = topicSlugFromSource(quiz.slug) || topicSlugFromSource(quiz.title);

  return preferredTopicSlugsByDetectedSlug.get(detectedSlug) ?? detectedSlug ?? `topic-${quiz.category_slug}-${quiz.id}`;
}

function makeQuestionKey(quizId, questionId, position) {
  return `legacy-quiz-${quizId}-question-${questionId || position}`;
}

function answerKeyFromPosition(position) {
  return ["A", "B", "C", "D"][position - 1] ?? null;
}

async function loadClassicQuizzes(connection) {
  const [rows] = await connection.execute(
    `SELECT
       q.id,
       q.slug,
       q.title,
       q.image_url,
       q.difficulty,
       q.category_id,
       c.name AS category_name,
       c.slug AS category_slug
     FROM quizzes q
     INNER JOIN quiz_categories c ON c.id = q.category_id
     WHERE q.is_active = 1
       AND c.is_active = 1
     ORDER BY c.id ASC, q.id ASC`
  );

  return rows;
}

async function loadQuizQuestions(connection, quizId) {
  const [rows] = await connection.execute(
    `SELECT id, question_text, image_url, explanation, position, is_active
     FROM quiz_questions
     WHERE quiz_id = ?
       AND is_active = 1
     ORDER BY position ASC, id ASC`,
    [quizId]
  );

  return rows;
}

async function loadQuestionAnswers(connection, questionId) {
  const [rows] = await connection.execute(
    `SELECT id, answer_text, image_url, is_correct, position, is_active
     FROM quiz_answers
     WHERE question_id = ?
       AND is_active = 1
     ORDER BY position ASC, id ASC`,
    [questionId]
  );

  return rows;
}

async function getOrCreateTopic(connection, topic) {
  if (!apply) {
    return {
      id: `dry:${topic.slug}`,
      created: true,
    };
  }

  await connection.execute(
    `INSERT INTO quiz_topics (category_id, name, slug, description, image_url, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
       category_id = VALUES(category_id),
       name = VALUES(name),
       description = COALESCE(VALUES(description), description),
       image_url = COALESCE(VALUES(image_url), image_url),
       is_active = 1,
       updated_at = NOW()`,
    [topic.categoryId, topic.name, topic.slug, topic.description, topic.imageUrl]
  );

  const [rows] = await connection.execute("SELECT id FROM quiz_topics WHERE slug = ? LIMIT 1", [topic.slug]);
  return {
    id: rows[0].id,
    created: false,
  };
}

async function getExistingQuestionId(connection, topicId, difficulty, questionKey) {
  if (!apply) return null;

  const [rows] = await connection.execute(
    `SELECT id
     FROM question_bank
     WHERE topic_id = ?
       AND difficulty = ?
       AND question_key = ?
     LIMIT 1`,
    [topicId, difficulty, questionKey]
  );

  return rows[0]?.id ?? null;
}

async function createQuestion(connection, topicId, difficulty, question, questionKey) {
  if (!apply) return `dry:${questionKey}`;

  const [result] = await connection.execute(
    `INSERT INTO question_bank (
       topic_id,
       difficulty,
       question_key,
       question_text,
       question_type,
       image_url,
       explanation,
       is_active,
       created_at,
       updated_at
     )
     VALUES (?, ?, ?, ?, 'multiple_choice', ?, ?, 1, NOW(), NOW())`,
    [topicId, difficulty, questionKey, question.question_text, question.image_url, question.explanation]
  );

  return result.insertId;
}

async function createAnswer(connection, questionId, answer, answerKey, position) {
  if (!apply) return;

  await connection.execute(
    `INSERT INTO question_bank_answers (
       question_id,
       answer_key,
       answer_text,
       image_url,
       is_correct,
       position,
       is_active,
       created_at,
       updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
    [questionId, answerKey, answer.answer_text, answer.image_url, answer.is_correct ? 1 : 0, position]
  );
}

async function migrate() {
  const connection = await mysql.createConnection(dbConfig);
  const stats = {
    quizzesSeen: 0,
    quizzesSkipped: 0,
    topicsSeen: new Map(),
    questionsSeen: 0,
    questionsCreated: 0,
    questionsSkipped: 0,
    answersCreated: 0,
    warnings: [],
  };

  try {
    if (apply) {
      await connection.beginTransaction();
    }

    const quizzes = await loadClassicQuizzes(connection);
    stats.quizzesSeen = quizzes.length;

    for (const quiz of quizzes) {
      const difficulty = detectDifficulty(quiz);

      if (!difficulty) {
        stats.quizzesSkipped += 1;
        stats.warnings.push(`Quiz ignore sans niveau reconnu: ${quiz.slug} (${quiz.title})`);
        continue;
      }

      const topicSlug = detectTopicSlug(quiz);
      const topicName = detectTopicName(quiz);
      const topic = {
        categoryId: quiz.category_id,
        categoryName: quiz.category_name,
        categorySlug: quiz.category_slug,
        name: topicName,
        slug: topicSlug,
        description: null,
        imageUrl: quiz.image_url,
      };
      const topicResult = await getOrCreateTopic(connection, topic);
      if (!stats.topicsSeen.has(topic.slug)) {
        stats.topicsSeen.set(topic.slug, {
          name: topic.name,
          slug: topic.slug,
          categoryName: topic.categoryName,
          categorySlug: topic.categorySlug,
          difficulties: {
            Easy: 0,
            Medium: 0,
            Hard: 0,
          },
          skipped: 0,
          sourceQuizzes: new Set(),
        });
      }
      const topicStats = stats.topicsSeen.get(topic.slug);
      topicStats.sourceQuizzes.add(`${quiz.slug} (${difficulty})`);

      const questions = await loadQuizQuestions(connection, quiz.id);

      for (const question of questions) {
        stats.questionsSeen += 1;

        if (!question.question_text?.trim() && !question.image_url) {
          stats.questionsSkipped += 1;
          topicStats.skipped += 1;
          stats.warnings.push(`Question ignoree sans texte ni image: quiz=${quiz.slug}, question_id=${question.id}`);
          continue;
        }

        const answers = (await loadQuestionAnswers(connection, question.id)).slice(0, 4);
        const correctAnswers = answers.filter((answer) => Number(answer.is_correct) === 1);

        if (answers.length < 2 || correctAnswers.length !== 1) {
          stats.questionsSkipped += 1;
          topicStats.skipped += 1;
          stats.warnings.push(
            `Question ignoree car elle doit avoir au moins 2 reponses et exactement 1 bonne reponse: quiz=${quiz.slug}, question_id=${question.id}, answers=${answers.length}, correct=${correctAnswers.length}`
          );
          continue;
        }

        const questionKey = makeQuestionKey(quiz.id, question.id, question.position);
        const existingQuestionId = await getExistingQuestionId(connection, topicResult.id, difficulty, questionKey);

        if (existingQuestionId) {
          stats.questionsSkipped += 1;
          continue;
        }

        const questionId = await createQuestion(connection, topicResult.id, difficulty, question, questionKey);
        stats.questionsCreated += 1;
        topicStats.difficulties[difficulty] += 1;

        for (let index = 0; index < answers.length; index += 1) {
          const answer = answers[index];
          const position = index + 1;
          const answerKey = answerKeyFromPosition(position);

          if (!answerKey) continue;

          await createAnswer(connection, questionId, answer, answerKey, position);
          stats.answersCreated += 1;
        }
      }
    }

    if (apply) {
      await connection.commit();
    }

    return stats;
  } catch (error) {
    if (apply) {
      await connection.rollback();
    }

    throw error;
  } finally {
    await connection.end();
  }
}

function printSummary(stats) {
  console.log(apply ? "Migration appliquee." : "Dry-run uniquement. Relancer avec --apply pour ecrire en base.");
  console.log(`Quiz lus: ${stats.quizzesSeen}`);
  console.log(`Quiz ignores: ${stats.quizzesSkipped}`);
  console.log(`Topics detectes: ${stats.topicsSeen.size}`);
  console.log(`Questions lues: ${stats.questionsSeen}`);
  console.log(`Questions ${apply ? "creees" : "a creer"}: ${stats.questionsCreated}`);
  console.log(`Questions ignorees/deja presentes: ${stats.questionsSkipped}`);
  console.log(`Reponses ${apply ? "creees" : "a creer"}: ${stats.answersCreated}`);

  if (stats.topicsSeen.size > 0) {
    console.log("\nTopics detectes par categorie et niveau:");
    for (const topic of stats.topicsSeen.values()) {
      console.log(
        `- ${topic.name} (${topic.slug}) | categorie: ${topic.categoryName} (${topic.categorySlug}) | Easy: ${topic.difficulties.Easy} | Medium: ${topic.difficulties.Medium} | Hard: ${topic.difficulties.Hard} | ignorees: ${topic.skipped}`
      );
      console.log(`  quiz sources: ${Array.from(topic.sourceQuizzes).join(", ")}`);
    }
  }

  const incompleteTopics = [];

  for (const topic of stats.topicsSeen.values()) {
    for (const difficulty of ["Easy", "Medium", "Hard"]) {
      const count = topic.difficulties[difficulty];

      if (count < 20) {
        incompleteTopics.push(`${topic.name} ${difficulty}: ${count} questions`);
      }
    }
  }

  if (incompleteTopics.length > 0) {
    console.log("\nAlertes niveaux incomplets ou sous 20 questions:");
    for (const alert of incompleteTopics) {
      console.log(`- ${alert}`);
    }
  }

  if (stats.warnings.length > 0) {
    console.log("\nAvertissements:");
    for (const warning of stats.warnings) {
      console.log(`- ${warning}`);
    }
  }
}

migrate()
  .then(printSummary)
  .catch((error) => {
    console.error("Migration impossible.");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
