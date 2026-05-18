import { NextResponse } from "next/server";
import mysql from "mysql2/promise";

export const runtime = "nodejs";

type InsertOptionPayload = {
  key?: string;
  text?: string;
  imageUrl?: string;
  isCorrect?: boolean;
};

type InsertQuestionPayload = {
  testId?: number;
  sectionId?: number;
  questionKey?: string;
  questionText?: string;
  questionFormat?: string;
  difficultyLevel?: number;
  weight?: number;
  timeLimitSeconds?: number | null;
  displayTimeSeconds?: number | null;
  hideStimulusAfterSeconds?: number | null;
  stimulusText?: string;
  questionImageUrl?: string;
  explanation?: string;
  isActive?: boolean;
  options?: InsertOptionPayload[];
  overlay?: {
    questionImageUrl?: string;
    answersImageUrl?: string;
    answerCount?: number;
    gridColumns?: number;
    gridRows?: number;
    correctPosition?: number;
    correctionText?: string;
  };
};

type TestRow = {
  id: number;
  title: string;
  slug: string;
};

type SectionRow = {
  id: number;
  test_id: number;
  section_key: string;
  title: string;
  section_type: string;
};

type PositionRow = {
  next_position: number | null;
};

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 8889),
  user: process.env.QUIZHUB_DB_USER ?? "root",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "root",
  database: process.env.QUIZHUB_DB_NAME ?? "qifree_local",
};

const QUESTION_FORMATS = new Set(["text", "memory_text", "memory_numbers", "memory_image", "image_choice", "spatial_overlay", "visual_overlay"]);
const OPTION_KEYS = ["A", "B", "C", "D", "E", "F"];

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanPositiveInteger(value: unknown) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
}

function cleanNonNegativeInteger(value: unknown) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue >= 0 ? numericValue : null;
}

function makeQuestionKey(sectionKey: string) {
  return `insert-${sectionKey}-${Date.now()}`;
}

function isOverlayFormat(format: string) {
  return format === "visual_overlay" || format === "spatial_overlay";
}

export async function GET() {
  let connection: mysql.Connection | undefined;

  try {
    connection = await mysql.createConnection(dbConfig);

    const [testRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, title, slug
       FROM iq_tests
       WHERE is_active = 1
       ORDER BY id ASC`
    );
    const [sectionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, test_id, section_key, title, section_type
       FROM iq_sections
       WHERE is_active = 1
       ORDER BY test_id ASC, position ASC, id ASC`
    );

    return NextResponse.json({
      tests: testRows as TestRow[],
      sections: sectionRows as SectionRow[],
      formats: Array.from(QUESTION_FORMATS),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Impossible de charger les donnees QI.",
      },
      { status: 500 }
    );
  } finally {
    await connection?.end();
  }
}

export async function POST(request: Request) {
  let connection: mysql.Connection | undefined;

  try {
    const payload = (await request.json()) as InsertQuestionPayload;
    const testId = cleanPositiveInteger(payload.testId);
    const sectionId = cleanPositiveInteger(payload.sectionId);
    const questionFormat = typeof payload.questionFormat === "string" && QUESTION_FORMATS.has(payload.questionFormat) ? payload.questionFormat : null;
    const difficultyLevel = cleanPositiveInteger(payload.difficultyLevel) ?? 1;
    const weight = Number(payload.weight);
    const safeWeight = Number.isFinite(weight) && weight > 0 ? weight : 1;
    const questionText = cleanText(payload.questionText);
    const stimulusText = cleanText(payload.stimulusText);
    const questionImageUrl = cleanText(payload.questionImageUrl);
    const explanation = cleanText(payload.explanation);
    const timeLimitSeconds = cleanPositiveInteger(payload.timeLimitSeconds);
    const displayTimeSeconds = cleanPositiveInteger(payload.displayTimeSeconds);
    const hideStimulusAfterSeconds = cleanPositiveInteger(payload.hideStimulusAfterSeconds);

    if (!testId || !sectionId || !questionFormat) {
      return NextResponse.json({ error: "Test, section et format sont obligatoires." }, { status: 400 });
    }

    if (!questionText && !stimulusText && !questionImageUrl && !payload.overlay?.questionImageUrl) {
      return NextResponse.json({ error: "Ajoute au moins un texte, un stimulus ou une image de question." }, { status: 400 });
    }

    const optionPayloads = (payload.options ?? [])
      .map((option, index) => ({
        key: cleanText(option.key)?.toUpperCase() ?? OPTION_KEYS[index] ?? String(index + 1),
        text: cleanText(option.text),
        imageUrl: cleanText(option.imageUrl),
        isCorrect: option.isCorrect === true,
      }))
      .filter((option) => option.text || option.imageUrl);

    if (!isOverlayFormat(questionFormat)) {
      const correctOptionCount = optionPayloads.filter((option) => option.isCorrect).length;

      if (optionPayloads.length < 2) {
        return NextResponse.json({ error: "Ajoute au moins deux options pour une question non-overlay." }, { status: 400 });
      }

      if (correctOptionCount !== 1) {
        return NextResponse.json({ error: "Choisis exactement une bonne reponse." }, { status: 400 });
      }
    }

    const overlay = payload.overlay ?? {};
    const overlayQuestionImageUrl = cleanText(overlay.questionImageUrl) ?? questionImageUrl;
    const answersImageUrl = cleanText(overlay.answersImageUrl);
    const answerCount = cleanPositiveInteger(overlay.answerCount) ?? 4;
    const gridColumns = cleanPositiveInteger(overlay.gridColumns) ?? (answerCount === 6 ? 3 : 2);
    const gridRows = cleanPositiveInteger(overlay.gridRows) ?? 2;
    const correctPosition = cleanPositiveInteger(overlay.correctPosition);
    const correctionText = cleanText(overlay.correctionText);

    if (isOverlayFormat(questionFormat)) {
      if (!overlayQuestionImageUrl || !answersImageUrl || !correctPosition) {
        return NextResponse.json({ error: "Image question, image reponses et position correcte sont obligatoires pour une question overlay." }, { status: 400 });
      }

      if (![4, 6].includes(answerCount)) {
        return NextResponse.json({ error: "answer_count doit etre 4 ou 6." }, { status: 400 });
      }

      if (correctPosition < 1 || correctPosition > answerCount) {
        return NextResponse.json({ error: "La position correcte doit etre comprise dans le nombre de reponses." }, { status: 400 });
      }
    }

    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    const [sectionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT id, test_id, section_key, title, section_type
       FROM iq_sections
       WHERE id = ? AND test_id = ? AND is_active = 1
       LIMIT 1`,
      [sectionId, testId]
    );
    const section = (sectionRows as SectionRow[])[0];

    if (!section) {
      await connection.rollback();
      return NextResponse.json({ error: "Section de raisonnement introuvable pour ce test." }, { status: 404 });
    }

    const [positionRows] = await connection.execute<mysql.RowDataPacket[]>(
      `SELECT COALESCE(MAX(position), 0) + 1 AS next_position
       FROM iq_questions
       WHERE section_id = ?`,
      [sectionId]
    );
    const nextPosition = ((positionRows as PositionRow[])[0]?.next_position ?? 1) || 1;
    const questionKey = cleanText(payload.questionKey) ?? makeQuestionKey(section.section_key);

    const [questionResult] = await connection.execute<mysql.ResultSetHeader>(
      `INSERT INTO iq_questions
       (test_id, section_id, question_key, question_text, question_format, difficulty_level, weight,
        time_limit_seconds, display_time_seconds, hide_stimulus_after_seconds, stimulus_text,
        question_image_url, explanation, position, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        testId,
        sectionId,
        questionKey,
        questionText,
        questionFormat,
        difficultyLevel,
        safeWeight,
        timeLimitSeconds,
        displayTimeSeconds,
        hideStimulusAfterSeconds,
        stimulusText,
        questionImageUrl,
        explanation,
        nextPosition,
        payload.isActive === false ? 0 : 1,
      ]
    );
    const questionId = questionResult.insertId;

    if (isOverlayFormat(questionFormat)) {
      await connection.execute(
        `INSERT INTO iq_spatial_overlay_questions
         (question_id, question_image_url, answers_image_url, answer_count, grid_columns, grid_rows, correct_position, correction_text, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [questionId, overlayQuestionImageUrl, answersImageUrl, String(answerCount), gridColumns, gridRows, correctPosition, correctionText]
      );
    } else {
      for (let index = 0; index < optionPayloads.length; index += 1) {
        const option = optionPayloads[index];

        await connection.execute(
          `INSERT INTO iq_question_options
           (question_id, option_key, option_text, option_image_url, is_correct, position, is_active)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [questionId, option.key, option.text, option.imageUrl, option.isCorrect ? 1 : 0, index + 1]
        );
      }
    }

    await connection.commit();

    return NextResponse.json({
      questionId,
      questionKey,
      position: nextPosition,
      section: {
        id: section.id,
        key: section.section_key,
        title: section.title,
      },
    });
  } catch (error) {
    await connection?.rollback();

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Impossible d'inserer la question QI.",
      },
      { status: 500 }
    );
  } finally {
    await connection?.end();
  }
}
