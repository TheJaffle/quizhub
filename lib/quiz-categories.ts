import "server-only";
import mysql from "mysql2/promise";

export type HomeQuizCategory = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string;
  count: number;
};

type QuizCategoryRow = {
  id: number;
  name: string;
  slug: string;
  image_url: string;
  quiz_count: number | null;
};

export type QuizCategoriesResult =
  | { categories: HomeQuizCategory[]; error?: undefined }
  | { categories: HomeQuizCategory[]; error: string };

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

export async function getHomeQuizCategories(): Promise<QuizCategoriesResult> {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT
         c.id,
         c.name,
         c.slug,
         c.image_url,
         COUNT(q.id) AS quiz_count
       FROM quiz_categories c
       LEFT JOIN quizzes q ON q.category_id = c.id AND q.is_active = 1
       WHERE c.is_active = 1
       GROUP BY c.id, c.name, c.slug, c.image_url
       ORDER BY c.id ASC`
    );

    const categories = (rows as QuizCategoryRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      imageUrl: row.image_url,
      count: row.quiz_count ?? 0,
    }));

    return { categories };
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "Erreur MySQL inconnue";

    return {
      categories: [],
      error:
        process.env.NODE_ENV === "development"
          ? `Impossible de charger les catégories depuis MySQL : ${message}`
          : "Impossible de charger les catégories pour le moment.",
    };
  } finally {
    await connection?.end();
  }
}
