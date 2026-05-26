import "server-only";
import mysql from "mysql2/promise";

export type QuizDifficulty = "Easy" | "Medium" | "Hard";

export type QuizTopicQuestionCounts = Record<QuizDifficulty, number>;

export type QuizTopicCategory = {
  id: number;
  name: string;
  slug: string;
};

export type QuizTopicCard = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string;
  category: QuizTopicCategory;
  questionCounts: QuizTopicQuestionCounts;
  totalQuestions: number;
  availableDifficulties: QuizDifficulty[];
};

export type CategoryTopicsResult =
  | { category: QuizTopicCategory | null; topics: QuizTopicCard[]; error?: undefined }
  | { category: QuizTopicCategory | null; topics: QuizTopicCard[]; error: string };

export type TopicResult =
  | { topic: QuizTopicCard | null; error?: undefined }
  | { topic: QuizTopicCard | null; error: string };

type TopicRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  category_id: number;
  category_name: string;
  category_slug: string;
  easy_count: string | number;
  medium_count: string | number;
  hard_count: string | number;
};

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

const difficulties: QuizDifficulty[] = ["Easy", "Medium", "Hard"];

function mapTopicRow(row: TopicRow): QuizTopicCard {
  const questionCounts = {
    Easy: Number(row.easy_count ?? 0),
    Medium: Number(row.medium_count ?? 0),
    Hard: Number(row.hard_count ?? 0),
  };

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url || "/placeholder.svg",
    category: {
      id: row.category_id,
      name: row.category_name,
      slug: row.category_slug,
    },
    questionCounts,
    totalQuestions: questionCounts.Easy + questionCounts.Medium + questionCounts.Hard,
    availableDifficulties: difficulties.filter((difficulty) => questionCounts[difficulty] > 0),
  };
}

function getTopicCountsSql(whereClause: string) {
  return `
    SELECT
      t.id,
      t.name,
      t.slug,
      t.description,
      t.image_url,
      c.id AS category_id,
      c.name AS category_name,
      c.slug AS category_slug,
      SUM(CASE WHEN qb.difficulty = 'Easy' AND qb.is_active = 1 THEN 1 ELSE 0 END) AS easy_count,
      SUM(CASE WHEN qb.difficulty = 'Medium' AND qb.is_active = 1 THEN 1 ELSE 0 END) AS medium_count,
      SUM(CASE WHEN qb.difficulty = 'Hard' AND qb.is_active = 1 THEN 1 ELSE 0 END) AS hard_count
    FROM quiz_topics t
    INNER JOIN quiz_categories c ON c.id = t.category_id
    LEFT JOIN question_bank qb ON qb.topic_id = t.id
    WHERE ${whereClause}
      AND t.is_active = 1
      AND c.is_active = 1
    GROUP BY t.id, t.name, t.slug, t.description, t.image_url, c.id, c.name, c.slug
  `;
}

export async function getCategoryTopicsBySlug(slug: string): Promise<CategoryTopicsResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [categoryRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, name, slug
       FROM quiz_categories
       WHERE slug = ? AND is_active = 1
       LIMIT 1`,
      [slug]
    );
    const category = (categoryRows as { id: number; name: string; slug: string }[])[0] ?? null;

    if (!category) {
      return { category: null, topics: [] };
    }

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `${getTopicCountsSql("c.slug = ?")}
       ORDER BY t.name ASC`,
      [slug]
    );

    return {
      category,
      topics: (rows as TopicRow[]).map(mapTopicRow),
    };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      category: null,
      topics: [],
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger les thèmes depuis MySQL : ${message}`
          : "Impossible de charger les thèmes pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}

export async function getQuizTopicBySlug(slug: string): Promise<TopicResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `${getTopicCountsSql("t.slug = ?")}
       LIMIT 1`,
      [slug]
    );
    const topic = (rows as TopicRow[])[0];

    return { topic: topic ? mapTopicRow(topic) : null };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      topic: null,
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger le thème depuis MySQL : ${message}`
          : "Impossible de charger ce thème pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}
