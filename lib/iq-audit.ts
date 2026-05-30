import "server-only";
import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

export type IqAuditOption = {
  key: string;
  text: string | null;
  imageUrl: string | null;
  position: number;
  isCorrect: boolean;
};

export type IqAuditQuestion = {
  id: number;
  questionKey: string;
  sectionKey: string;
  sectionTitle: string;
  questionText: string | null;
  answerPromptText: string | null;
  questionFormat: string;
  questionImageUrl: string | null;
  overlayQuestionImageUrl: string | null;
  answersImageUrl: string | null;
  overlayAnswerCount: number | null;
  overlayCorrectPosition: number | null;
  promptAudioUrl: string | null;
  options: IqAuditOption[];
  optionCount: number;
  correctOptionKeys: string[];
  correctOptionPositions: number[];
};

export type IqAuditSection = {
  key: string;
  title: string;
  questions: IqAuditQuestion[];
};

type QuestionRow = {
  id: number;
  question_key: string;
  section_key: string;
  section_title: string;
  question_text: string | null;
  answer_prompt_text: string | null;
  question_format: string;
  question_image_url: string | null;
  overlay_question_image_url: string | null;
  answers_image_url: string | null;
  overlay_answer_count: string | number | null;
  overlay_correct_position: number | null;
  prompt_audio_url: string | null;
};

type OptionRow = {
  question_id: number;
  option_key: string;
  option_text: string | null;
  option_image_url: string | null;
  position: number;
  is_correct: number;
};

export async function getIqAuditSections() {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [questionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT q.id,
              q.question_key,
              s.section_key,
              s.title AS section_title,
              q.question_text,
              q.answer_prompt_text,
              q.question_format,
              q.question_image_url,
              overlay.question_image_url AS overlay_question_image_url,
              overlay.answers_image_url,
              overlay.answer_count AS overlay_answer_count,
              overlay.correct_position AS overlay_correct_position,
              audio.prompt_audio_url
       FROM iq_questions q
       INNER JOIN iq_sections s ON s.id = q.section_id
       LEFT JOIN iq_spatial_overlay_questions overlay ON overlay.question_id = q.id AND overlay.is_active = 1
       LEFT JOIN iq_audio_memory_questions audio ON audio.question_id = q.id
       WHERE q.is_active = 1
         AND s.is_active = 1
         AND s.section_key IN ('logic', 'spatial', 'verbal', 'quantitative', 'memory', 'long_memory', 'audio_memory', 'speed')
       ORDER BY s.position ASC, q.position ASC, q.id ASC`
    );

    const questionIds = (questionRows as QuestionRow[]).map((row) => row.id);
    const optionsByQuestionId = new Map<number, IqAuditOption[]>();

    if (questionIds.length > 0) {
      const placeholders = questionIds.map(() => "?").join(", ");
      const [optionRows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT question_id, option_key, option_text, option_image_url, position, is_correct
         FROM iq_question_options
         WHERE is_active = 1
           AND question_id IN (${placeholders})
         ORDER BY question_id ASC, position ASC`,
        questionIds
      );

      for (const row of optionRows as OptionRow[]) {
        const existing = optionsByQuestionId.get(row.question_id) ?? [];
        existing.push({
          key: row.option_key,
          text: row.option_text,
          imageUrl: row.option_image_url,
          position: Number(row.position),
          isCorrect: row.is_correct === 1,
        });
        optionsByQuestionId.set(row.question_id, existing);
      }
    }

    const sectionsByKey = new Map<string, IqAuditSection>();

    for (const row of questionRows as QuestionRow[]) {
      const existingSection = sectionsByKey.get(row.section_key) ?? {
        key: row.section_key,
        title: row.section_title,
        questions: [],
      };
      const options = optionsByQuestionId.get(row.id) ?? [];
      const correctOptions = options.filter((option) => option.isCorrect);

      existingSection.questions.push({
        id: row.id,
        questionKey: row.question_key,
        sectionKey: row.section_key,
        sectionTitle: row.section_title,
        questionText: row.question_text,
        answerPromptText: row.answer_prompt_text,
        questionFormat: row.question_format,
        questionImageUrl: row.question_image_url,
        overlayQuestionImageUrl: row.overlay_question_image_url,
        answersImageUrl: row.answers_image_url,
        overlayAnswerCount: row.overlay_answer_count === null ? null : Number(row.overlay_answer_count),
        overlayCorrectPosition: row.overlay_correct_position === null ? null : Number(row.overlay_correct_position),
        promptAudioUrl: row.prompt_audio_url,
        options,
        optionCount: options.length,
        correctOptionKeys: correctOptions.map((option) => option.key),
        correctOptionPositions: correctOptions.map((option) => option.position),
      });

      sectionsByKey.set(row.section_key, existingSection);
    }

    return Array.from(sectionsByKey.values());
  } finally {
    await connection?.end();
  }
}
