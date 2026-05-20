import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const rootDir = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, relativePath), "utf8"));
}

const dbConfig = {
  host: process.env.QUIZHUB_DB_HOST ?? "localhost",
  port: Number(process.env.QUIZHUB_DB_PORT ?? 3306),
  user: process.env.QUIZHUB_DB_USER ?? "quizhub",
  password: process.env.QUIZHUB_DB_PASSWORD ?? "quizhub",
  database: process.env.QUIZHUB_DB_NAME ?? "quizhub",
  multipleStatements: true,
};

const testDefinitions = [
  { slug: "test-qi-complet", title: "Test", file: "Test.json" },
  { slug: "sondage", title: "Sondage", file: "Sondage.json" },
  { slug: "basic", title: "Basic", file: "Basic.json" },
  { slug: "premium", title: "Premium", file: "Premium.json" },
];

function normalizeLongMemoryPrompt(question) {
  return question.answerPromptText ?? question.answer_prompt_text ?? null;
}

async function ensureColumn(connection, tableName, columnName, definitionSql) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  if (Number(rows[0]?.count ?? 0) === 0) {
    await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definitionSql}`);
  }
}

async function ensureQuestionBankColumn(connection) {
  await ensureColumn(connection, "iq_tests", "question_bank_test_id", "INT(10) UNSIGNED NULL AFTER sequence_definition");
}

async function ensureCoreColumns(connection) {
  await ensureColumn(connection, "iq_attempts", "resolved_sequence_definition", "LONGTEXT NULL AFTER attempt_token");
  await ensureColumn(connection, "iq_attempts", "long_memory_state", "LONGTEXT NULL AFTER resolved_sequence_definition");
  await ensureColumn(connection, "iq_attempts", "quantitative_score", "DECIMAL(10,2) NULL AFTER logic_score");
  await ensureColumn(connection, "iq_attempts", "audio_memory_score", "DECIMAL(10,2) NULL AFTER quantitative_score");
  await ensureColumn(connection, "iq_attempts", "long_memory_score", "DECIMAL(10,2) NULL AFTER audio_memory_score");
  await ensureColumn(connection, "iq_questions", "answer_prompt_text", "TEXT NULL AFTER question_text");
}

async function ensureAudioMemoryTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS iq_audio_memory_questions (
      id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
      question_id INT(10) UNSIGNED NOT NULL,
      prompt_audio_url VARCHAR(255) NOT NULL,
      max_stimulus_plays TINYINT(3) UNSIGNED NOT NULL DEFAULT 1,
      transition_delay_ms INT(10) UNSIGNED NOT NULL DEFAULT 1800,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_iq_audio_memory_question_id (question_id),
      CONSTRAINT fk_iq_audio_memory_questions_question
        FOREIGN KEY (question_id) REFERENCES iq_questions(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function ensureTests(connection) {
  const [[bankRow]] = await connection.query(
    `SELECT id
     FROM iq_tests
     WHERE slug = 'test-qi-complet'
     LIMIT 1`
  );

  if (!bankRow?.id) {
    throw new Error("Le test principal 'test-qi-complet' est introuvable.");
  }

  const bankId = Number(bankRow.id);
  await connection.query(`UPDATE iq_tests SET question_bank_test_id = ? WHERE id = ?`, [bankId, bankId]);

  for (const testDefinition of testDefinitions.slice(1)) {
    const [rows] = await connection.query(
      `SELECT id
       FROM iq_tests
       WHERE slug = ?
       LIMIT 1`,
      [testDefinition.slug]
    );

    if (rows.length === 0) {
      await connection.query(
        `INSERT INTO iq_tests (title, slug, description, image_url, total_time_limit_seconds, sequence_definition, question_bank_test_id, is_active, created_at, updated_at)
         VALUES (?, ?, NULL, NULL, NULL, NULL, ?, 1, NOW(), NOW())`,
        [testDefinition.title, testDefinition.slug, bankId]
      );
    } else {
      await connection.query(`UPDATE iq_tests SET question_bank_test_id = ?, is_active = 1, updated_at = NOW() WHERE slug = ?`, [bankId, testDefinition.slug]);
    }
  }

  return bankId;
}

async function syncTestSequences(connection, bankId) {
  for (const testDefinition of testDefinitions) {
    const sequenceDefinition = fs.readFileSync(path.join(rootDir, testDefinition.file), "utf8");
    JSON.parse(sequenceDefinition);

    if (testDefinition.slug === "test-qi-complet") {
      await connection.query(
        `UPDATE iq_tests
         SET sequence_definition = ?, question_bank_test_id = ?, updated_at = NOW()
         WHERE slug = ?`,
        [sequenceDefinition, bankId, testDefinition.slug]
      );
      continue;
    }

    await connection.query(
      `UPDATE iq_tests
       SET sequence_definition = ?, question_bank_test_id = ?, is_active = 1, updated_at = NOW()
       WHERE slug = ?`,
      [sequenceDefinition, bankId, testDefinition.slug]
    );
  }
}

async function ensureSection(connection, bankId, section) {
  const [rows] = await connection.query(
    `SELECT id
     FROM iq_sections
     WHERE test_id = ? AND section_key = ?
     LIMIT 1`,
    [bankId, section.key]
  );

  if (rows.length === 0) {
    await connection.query(
      `INSERT INTO iq_sections (
         test_id, section_key, title, description, section_type, time_limit_seconds, display_time_seconds,
         position, is_active, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [bankId, section.key, section.title, section.description, section.sectionType, section.timeLimitSeconds ?? null, section.displayTimeSeconds ?? null, section.position]
    );
  } else {
    await connection.query(
      `UPDATE iq_sections
       SET title = ?, description = ?, section_type = ?, time_limit_seconds = ?, display_time_seconds = ?, position = ?, is_active = 1, updated_at = NOW()
       WHERE test_id = ? AND section_key = ?`,
      [section.title, section.description, section.sectionType, section.timeLimitSeconds ?? null, section.displayTimeSeconds ?? null, section.position, bankId, section.key]
    );
  }

  const [[sectionRow]] = await connection.query(
    `SELECT id
     FROM iq_sections
     WHERE test_id = ? AND section_key = ?
     LIMIT 1`,
    [bankId, section.key]
  );

  return Number(sectionRow.id);
}

async function clearSectionQuestions(connection, bankId, sectionId, clearAudioTable = false) {
  if (clearAudioTable) {
    await connection.query(
      `DELETE audio
       FROM iq_audio_memory_questions audio
       INNER JOIN iq_questions q ON q.id = audio.question_id
       WHERE q.test_id = ? AND q.section_id = ?`,
      [bankId, sectionId]
    );
  }

  await connection.query(
    `DELETE overlay
     FROM iq_spatial_overlay_questions overlay
     INNER JOIN iq_questions q ON q.id = overlay.question_id
     WHERE q.test_id = ? AND q.section_id = ?`,
    [bankId, sectionId]
  );
  await connection.query(
    `DELETE opt
     FROM iq_question_options opt
     INNER JOIN iq_questions q ON q.id = opt.question_id
     WHERE q.test_id = ? AND q.section_id = ?`,
    [bankId, sectionId]
  );
  await connection.query(`DELETE FROM iq_questions WHERE test_id = ? AND section_id = ?`, [bankId, sectionId]);
}

async function syncLongMemory(connection, bankId) {
  const sectionId = await ensureSection(connection, bankId, {
    key: "long_memory",
    title: "Memoire longue",
    description: "Stimulus memorise puis rappel differe plus tard dans le test.",
    sectionType: "memory",
    timeLimitSeconds: null,
    displayTimeSeconds: null,
    position: 7,
  });

  await clearSectionQuestions(connection, bankId, sectionId);

  const questions = readJson("data/iq/long-memory.json");

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const [result] = await connection.query(
      `INSERT INTO iq_questions (
         test_id, section_id, question_key, question_text, answer_prompt_text, question_format,
         difficulty_level, weight, time_limit_seconds, display_time_seconds, hide_stimulus_after_seconds,
         stimulus_text, question_image_url, explanation, position, is_active, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        bankId,
        sectionId,
        question.questionKey,
        question.questionText ?? null,
        normalizeLongMemoryPrompt(question),
        question.questionFormat,
        Number(question.difficultyLevel ?? 1),
        Number(question.weight ?? 1),
        Number(question.displayTimeSeconds ?? 6),
        question.stimulusText ?? null,
        question.questionImageUrl ?? null,
        question.explanation ?? "",
        index + 1,
      ]
    );
    const questionId = result.insertId;

    if (Array.isArray(question.options)) {
      for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
        const option = question.options[optionIndex];
        await connection.query(
          `INSERT INTO iq_question_options (
             question_id, option_key, option_text, option_image_url, is_correct, position, is_active, created_at, updated_at
           ) VALUES (?, ?, ?, NULL, ?, ?, 1, NOW(), NOW())`,
          [questionId, option.key, option.text ?? null, option.isCorrect ? 1 : 0, optionIndex + 1]
        );
      }
    }

    if (question.overlay) {
      await connection.query(
        `INSERT INTO iq_spatial_overlay_questions (
           question_id, question_image_url, answers_image_url, answer_count, grid_columns, grid_rows,
           correct_position, correction_text, is_active, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          questionId,
          question.overlay.questionImageUrl,
          question.overlay.answersImageUrl,
          String(question.overlay.answerCount ?? 4),
          Number(question.overlay.gridColumns ?? 2),
          Number(question.overlay.gridRows ?? 2),
          Number(question.overlay.correctPosition),
          question.overlay.correctionText ?? "",
        ]
      );
    }
  }
}

async function syncMemory(connection, bankId) {
  const [[memorySectionRow]] = await connection.query(
    `SELECT section_type, time_limit_seconds, display_time_seconds
     FROM iq_sections
     WHERE test_id = ? AND section_key = 'memory'
     LIMIT 1`,
    [bankId]
  );

  const sectionId = await ensureSection(connection, bankId, {
    key: "memory",
    title: "Memoire",
    description: "Memorisez rapidement un stimulus puis repondez dans le temps imparti.",
    sectionType: memorySectionRow?.section_type ?? "memory",
    timeLimitSeconds: memorySectionRow?.time_limit_seconds ?? null,
    displayTimeSeconds: memorySectionRow?.display_time_seconds ?? null,
    position: 4,
  });

  await clearSectionQuestions(connection, bankId, sectionId);

  const questions = readJson("data/iq/memory.json");

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const [result] = await connection.query(
      `INSERT INTO iq_questions (
         test_id, section_id, question_key, question_text, answer_prompt_text, question_format,
         difficulty_level, weight, time_limit_seconds, display_time_seconds, hide_stimulus_after_seconds,
         stimulus_text, question_image_url, explanation, position, is_active, created_at, updated_at
       ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        bankId,
        sectionId,
        question.questionKey,
        question.questionText ?? null,
        question.questionFormat,
        Number(question.difficultyLevel ?? 1),
        Number(question.weight ?? 1),
        Number(question.timeLimitSeconds ?? memorySectionRow?.time_limit_seconds ?? 15),
        Number(question.displayTimeSeconds ?? memorySectionRow?.display_time_seconds ?? 4),
        question.stimulusText ?? null,
        question.questionImageUrl ?? null,
        question.explanation ?? "",
        index + 1,
      ]
    );
    const questionId = result.insertId;

    if (Array.isArray(question.options)) {
      for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
        const option = question.options[optionIndex];
        await connection.query(
          `INSERT INTO iq_question_options (
             question_id, option_key, option_text, option_image_url, is_correct, position, is_active, created_at, updated_at
           ) VALUES (?, ?, ?, NULL, ?, ?, 1, NOW(), NOW())`,
          [questionId, option.key, option.text ?? null, option.isCorrect ? 1 : 0, optionIndex + 1]
        );
      }
    }

    if (question.overlay) {
      await connection.query(
        `INSERT INTO iq_spatial_overlay_questions (
           question_id, question_image_url, answers_image_url, answer_count, grid_columns, grid_rows,
           correct_position, correction_text, is_active, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          questionId,
          question.overlay.questionImageUrl,
          question.overlay.answersImageUrl,
          String(question.overlay.answerCount ?? 4),
          Number(question.overlay.gridColumns ?? 2),
          Number(question.overlay.gridRows ?? 2),
          Number(question.overlay.correctPosition),
          question.overlay.correctionText ?? "",
        ]
      );
    }
  }
}

async function syncQuantitative(connection, bankId) {
  const [[logicSectionRow]] = await connection.query(
    `SELECT section_type, time_limit_seconds, display_time_seconds
     FROM iq_sections
     WHERE test_id = ? AND section_key = 'logic'
     LIMIT 1`,
    [bankId]
  );

  const sectionId = await ensureSection(connection, bankId, {
    key: "quantitative",
    title: "Quantitatif",
    description: "Questions de calcul et resolution de problemes quantitatifs.",
    sectionType: logicSectionRow?.section_type ?? "logic",
    timeLimitSeconds: logicSectionRow?.time_limit_seconds ?? null,
    displayTimeSeconds: logicSectionRow?.display_time_seconds ?? null,
    position: 6,
  });

  await clearSectionQuestions(connection, bankId, sectionId);

  const questions = readJson("data/iq/quantitative.json");

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const [result] = await connection.query(
      `INSERT INTO iq_questions (
         test_id, section_id, question_key, question_text, answer_prompt_text, question_format,
         difficulty_level, weight, time_limit_seconds, display_time_seconds, hide_stimulus_after_seconds,
         stimulus_text, question_image_url, explanation, position, is_active, created_at, updated_at
       ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        bankId,
        sectionId,
        question.questionKey,
        question.questionText ?? null,
        question.questionFormat,
        Number(question.difficultyLevel ?? 1),
        Number(question.weight ?? 1),
        Number(question.timeLimitSeconds ?? 45),
        question.stimulusText ?? null,
        question.questionImageUrl ?? null,
        question.explanation ?? "",
        index + 1,
      ]
    );
    const questionId = result.insertId;

    if (Array.isArray(question.options)) {
      for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
        const option = question.options[optionIndex];
        await connection.query(
          `INSERT INTO iq_question_options (
             question_id, option_key, option_text, option_image_url, is_correct, position, is_active, created_at, updated_at
           ) VALUES (?, ?, ?, NULL, ?, ?, 1, NOW(), NOW())`,
          [questionId, option.key, option.text ?? null, option.isCorrect ? 1 : 0, optionIndex + 1]
        );
      }
    }

    if (question.overlay) {
      await connection.query(
        `INSERT INTO iq_spatial_overlay_questions (
           question_id, question_image_url, answers_image_url, answer_count, grid_columns, grid_rows,
           correct_position, correction_text, is_active, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          questionId,
          question.overlay.questionImageUrl,
          question.overlay.answersImageUrl,
          String(question.overlay.answerCount ?? 4),
          Number(question.overlay.gridColumns ?? 2),
          Number(question.overlay.gridRows ?? 2),
          Number(question.overlay.correctPosition),
          question.overlay.correctionText ?? "",
        ]
      );
    }
  }
}

async function syncSpeed(connection, bankId) {
  const [[speedSectionRow]] = await connection.query(
    `SELECT section_type, time_limit_seconds, display_time_seconds
     FROM iq_sections
     WHERE test_id = ? AND section_key = 'speed'
     LIMIT 1`,
    [bankId]
  );

  const sectionId = await ensureSection(connection, bankId, {
    key: "speed",
    title: "Rapidite",
    description: "Questions courtes a reponse rapide avec limite de temps par question.",
    sectionType: speedSectionRow?.section_type ?? "speed",
    timeLimitSeconds: speedSectionRow?.time_limit_seconds ?? null,
    displayTimeSeconds: speedSectionRow?.display_time_seconds ?? null,
    position: 9,
  });

  await clearSectionQuestions(connection, bankId, sectionId);

  const questions = readJson("data/iq/speed.json");

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const [result] = await connection.query(
      `INSERT INTO iq_questions (
         test_id, section_id, question_key, question_text, answer_prompt_text, question_format,
         difficulty_level, weight, time_limit_seconds, display_time_seconds, hide_stimulus_after_seconds,
         stimulus_text, question_image_url, explanation, position, is_active, created_at, updated_at
       ) VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, NULL, NULL, ?, ?, ?, ?, 1, NOW(), NOW())`,
      [
        bankId,
        sectionId,
        question.questionKey,
        question.questionText ?? null,
        question.questionFormat,
        Number(question.difficultyLevel ?? 1),
        Number(question.weight ?? 1),
        Number(question.timeLimitSeconds ?? speedSectionRow?.time_limit_seconds ?? 8),
        question.stimulusText ?? null,
        question.questionImageUrl ?? null,
        question.explanation ?? "",
        index + 1,
      ]
    );
    const questionId = result.insertId;

    if (Array.isArray(question.options)) {
      for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
        const option = question.options[optionIndex];
        await connection.query(
          `INSERT INTO iq_question_options (
             question_id, option_key, option_text, option_image_url, is_correct, position, is_active, created_at, updated_at
           ) VALUES (?, ?, ?, NULL, ?, ?, 1, NOW(), NOW())`,
          [questionId, option.key, option.text ?? null, option.isCorrect ? 1 : 0, optionIndex + 1]
        );
      }
    }

    if (question.overlay) {
      await connection.query(
        `INSERT INTO iq_spatial_overlay_questions (
           question_id, question_image_url, answers_image_url, answer_count, grid_columns, grid_rows,
           correct_position, correction_text, is_active, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          questionId,
          question.overlay.questionImageUrl,
          question.overlay.answersImageUrl,
          String(question.overlay.answerCount ?? 4),
          Number(question.overlay.gridColumns ?? 2),
          Number(question.overlay.gridRows ?? 2),
          Number(question.overlay.correctPosition),
          question.overlay.correctionText ?? "",
        ]
      );
    }
  }
}

async function syncAudioMemory(connection, bankId) {
  const sectionId = await ensureSection(connection, bankId, {
    key: "audio_memory",
    title: "Sonore",
    description: "Questions de memoire auditive avec ecoute initiale puis rappel parmi plusieurs propositions audio.",
    sectionType: "memory",
    timeLimitSeconds: null,
    displayTimeSeconds: null,
    position: 8,
  });

  await clearSectionQuestions(connection, bankId, sectionId, true);

  const questions = readJson("data/iq/audio-memory.json");

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const [result] = await connection.query(
      `INSERT INTO iq_questions (
         test_id, section_id, question_key, question_text, answer_prompt_text, question_format,
         difficulty_level, weight, time_limit_seconds, display_time_seconds, hide_stimulus_after_seconds,
         stimulus_text, question_image_url, explanation, position, is_active, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 'text', ?, ?, NULL, NULL, NULL, NULL, NULL, '', ?, 1, NOW(), NOW())`,
      [
        bankId,
        sectionId,
        question.questionKey,
        question.questionText ?? null,
        question.answerPromptText ?? null,
        Number(question.difficultyLevel ?? 1),
        Number(question.weight ?? 1),
        index + 1,
      ]
    );
    const questionId = result.insertId;

    for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
      const option = question.options[optionIndex];
      await connection.query(
        `INSERT INTO iq_question_options (
           question_id, option_key, option_text, option_image_url, is_correct, position, is_active, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [questionId, option.key, `Proposition ${option.key}`, option.audioUrl, option.isCorrect ? 1 : 0, optionIndex + 1]
      );
    }

    await connection.query(
      `INSERT INTO iq_audio_memory_questions (
         question_id, prompt_audio_url, max_stimulus_plays, transition_delay_ms, created_at, updated_at
       ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [
        questionId,
        question.stimulusAudioUrl,
        Number(question.maxStimulusPlays ?? 1),
        Number(question.transitionDelayMs ?? 1800),
      ]
    );
  }
}

async function main() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    await connection.beginTransaction();
    await ensureQuestionBankColumn(connection);
    await ensureCoreColumns(connection);
    await ensureAudioMemoryTable(connection);
    const bankId = await ensureTests(connection);
    await syncTestSequences(connection, bankId);
    await syncMemory(connection, bankId);
    await syncQuantitative(connection, bankId);
    await syncLongMemory(connection, bankId);
    await syncSpeed(connection, bankId);
    await syncAudioMemory(connection, bankId);
    await connection.commit();

    console.log("IQ content synced successfully.");
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
