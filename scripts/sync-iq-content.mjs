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
  { slug: "test", title: "Test", file: "differents-tests/Test.json" },
  { slug: "sondage", title: "Sondage", file: "differents-tests/Sondage.json" },
  { slug: "sondage-light", title: "Sondage-light", file: "differents-tests/Sondage-light.json" },
  { slug: "basic", title: "Basic", file: "differents-tests/Basic.json" },
  
  { slug: "premium", title: "Premium", file: "differents-tests/Premium.json" },
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

// IMPORTANT: persistance des donnees.
// On ne supprime JAMAIS une question, une option, un overlay ou une ligne audio.
// Chaque entite est identifiee par une cle stable (question_key, option_key, ou question_id)
// et mise a jour en place (UPSERT). Une question/option absente du JSON est laissee telle quelle
// (UPSERT pur, aucune desactivation automatique). Ainsi le ON DELETE CASCADE ne se declenche
// jamais et aucune reponse d'un test deja passe ne peut disparaitre.

async function upsertQuestion(connection, bankId, sectionId, fields) {
  const [rows] = await connection.query(
    `SELECT id FROM iq_questions WHERE test_id = ? AND question_key = ? LIMIT 1`,
    [bankId, fields.questionKey]
  );

  const values = [
    fields.questionText ?? null,
    fields.answerPromptText ?? null,
    fields.questionFormat,
    Number(fields.difficultyLevel ?? 1),
    Number(fields.weight ?? 1),
    fields.timeLimitSeconds ?? null,
    fields.displayTimeSeconds ?? null,
    fields.hideStimulusAfterSeconds ?? null,
    fields.stimulusText ?? null,
    fields.questionImageUrl ?? null,
    fields.explanation ?? "",
    fields.position,
  ];

  if (rows.length > 0) {
    const questionId = Number(rows[0].id);
    await connection.query(
      `UPDATE iq_questions SET
         section_id = ?, question_text = ?, answer_prompt_text = ?, question_format = ?,
         difficulty_level = ?, weight = ?, time_limit_seconds = ?, display_time_seconds = ?,
         hide_stimulus_after_seconds = ?, stimulus_text = ?, question_image_url = ?, explanation = ?,
         position = ?, is_active = 1, updated_at = NOW()
       WHERE id = ?`,
      [sectionId, ...values, questionId]
    );
    return questionId;
  }

  const [result] = await connection.query(
    `INSERT INTO iq_questions (
       test_id, section_id, question_key, question_text, answer_prompt_text, question_format,
       difficulty_level, weight, time_limit_seconds, display_time_seconds, hide_stimulus_after_seconds,
       stimulus_text, question_image_url, explanation, position, is_active, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
    [bankId, sectionId, fields.questionKey, ...values]
  );
  return Number(result.insertId);
}

async function upsertOption(connection, questionId, option) {
  const [rows] = await connection.query(
    `SELECT id FROM iq_question_options WHERE question_id = ? AND option_key = ? LIMIT 1`,
    [questionId, option.key]
  );

  const values = [
    option.text ?? null,
    option.imageUrl ?? null,
    option.isCorrect ? 1 : 0,
    option.position,
  ];

  if (rows.length > 0) {
    await connection.query(
      `UPDATE iq_question_options SET
         option_text = ?, option_image_url = ?, is_correct = ?, position = ?, is_active = 1, updated_at = NOW()
       WHERE id = ?`,
      [...values, Number(rows[0].id)]
    );
    return;
  }

  await connection.query(
    `INSERT INTO iq_question_options (
       question_id, option_key, option_text, option_image_url, is_correct, position, is_active, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
    [questionId, option.key, ...values]
  );
}

async function upsertOverlay(connection, questionId, overlay) {
  const values = [
    overlay.questionImageUrl,
    overlay.answersImageUrl,
    String(overlay.answerCount ?? 4),
    Number(overlay.gridColumns ?? 2),
    Number(overlay.gridRows ?? 2),
    Number(overlay.correctPosition),
    overlay.correctionText ?? "",
  ];

  const [rows] = await connection.query(
    `SELECT id FROM iq_spatial_overlay_questions WHERE question_id = ? LIMIT 1`,
    [questionId]
  );

  if (rows.length > 0) {
    await connection.query(
      `UPDATE iq_spatial_overlay_questions SET
         question_image_url = ?, answers_image_url = ?, answer_count = ?, grid_columns = ?, grid_rows = ?,
         correct_position = ?, correction_text = ?, is_active = 1, updated_at = NOW()
       WHERE id = ?`,
      [...values, Number(rows[0].id)]
    );
    return;
  }

  await connection.query(
    `INSERT INTO iq_spatial_overlay_questions (
       question_id, question_image_url, answers_image_url, answer_count, grid_columns, grid_rows,
       correct_position, correction_text, is_active, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
    [questionId, ...values]
  );
}

async function upsertAudioMemory(connection, questionId, audio) {
  const values = [
    audio.promptAudioUrl,
    Number(audio.maxStimulusPlays ?? 1),
    Number(audio.transitionDelayMs ?? 1800),
  ];

  const [rows] = await connection.query(
    `SELECT id FROM iq_audio_memory_questions WHERE question_id = ? LIMIT 1`,
    [questionId]
  );

  if (rows.length > 0) {
    await connection.query(
      `UPDATE iq_audio_memory_questions SET
         prompt_audio_url = ?, max_stimulus_plays = ?, transition_delay_ms = ?, updated_at = NOW()
       WHERE id = ?`,
      [...values, Number(rows[0].id)]
    );
    return;
  }

  await connection.query(
    `INSERT INTO iq_audio_memory_questions (
       question_id, prompt_audio_url, max_stimulus_plays, transition_delay_ms, created_at, updated_at
     ) VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [questionId, ...values]
  );
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

  const questions = readJson("data/iq/long-memory.json");

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const questionId = await upsertQuestion(connection, bankId, sectionId, {
      questionKey: question.questionKey,
      questionText: question.questionText ?? null,
      answerPromptText: normalizeLongMemoryPrompt(question),
      questionFormat: question.questionFormat,
      difficultyLevel: question.difficultyLevel,
      weight: question.weight,
      timeLimitSeconds: null,
      displayTimeSeconds: Number(question.displayTimeSeconds ?? 6),
      hideStimulusAfterSeconds: null,
      stimulusText: question.stimulusText ?? null,
      questionImageUrl: question.questionImageUrl ?? null,
      explanation: question.explanation ?? "",
      position: index + 1,
    });

    if (Array.isArray(question.options)) {
      for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
        const option = question.options[optionIndex];
        await upsertOption(connection, questionId, {
          key: option.key,
          text: option.text ?? null,
          imageUrl: null,
          isCorrect: option.isCorrect,
          position: optionIndex + 1,
        });
      }
    }

    if (question.overlay) {
      await upsertOverlay(connection, questionId, question.overlay);
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

  const questions = readJson("data/iq/memory.json");

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const questionId = await upsertQuestion(connection, bankId, sectionId, {
      questionKey: question.questionKey,
      questionText: question.questionText ?? null,
      answerPromptText: null,
      questionFormat: question.questionFormat,
      difficultyLevel: question.difficultyLevel,
      weight: question.weight,
      timeLimitSeconds: Number(question.timeLimitSeconds ?? memorySectionRow?.time_limit_seconds ?? 15),
      displayTimeSeconds: Number(question.displayTimeSeconds ?? memorySectionRow?.display_time_seconds ?? 4),
      hideStimulusAfterSeconds: null,
      stimulusText: question.stimulusText ?? null,
      questionImageUrl: question.questionImageUrl ?? null,
      explanation: question.explanation ?? "",
      position: index + 1,
    });

    if (Array.isArray(question.options)) {
      for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
        const option = question.options[optionIndex];
        await upsertOption(connection, questionId, {
          key: option.key,
          text: option.text ?? null,
          imageUrl: null,
          isCorrect: option.isCorrect,
          position: optionIndex + 1,
        });
      }
    }

    if (question.overlay) {
      await upsertOverlay(connection, questionId, question.overlay);
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

  const questions = readJson("data/iq/quantitative.json");

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const questionId = await upsertQuestion(connection, bankId, sectionId, {
      questionKey: question.questionKey,
      questionText: question.questionText ?? null,
      answerPromptText: null,
      questionFormat: question.questionFormat,
      difficultyLevel: question.difficultyLevel,
      weight: question.weight,
      timeLimitSeconds: Number(question.timeLimitSeconds ?? 45),
      displayTimeSeconds: null,
      hideStimulusAfterSeconds: null,
      stimulusText: question.stimulusText ?? null,
      questionImageUrl: question.questionImageUrl ?? null,
      explanation: question.explanation ?? "",
      position: index + 1,
    });

    if (Array.isArray(question.options)) {
      for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
        const option = question.options[optionIndex];
        await upsertOption(connection, questionId, {
          key: option.key,
          text: option.text ?? null,
          imageUrl: null,
          isCorrect: option.isCorrect,
          position: optionIndex + 1,
        });
      }
    }

    if (question.overlay) {
      await upsertOverlay(connection, questionId, question.overlay);
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

  const questions = readJson("data/iq/speed.json");

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const questionId = await upsertQuestion(connection, bankId, sectionId, {
      questionKey: question.questionKey,
      questionText: question.questionText ?? null,
      answerPromptText: null,
      questionFormat: question.questionFormat,
      difficultyLevel: question.difficultyLevel,
      weight: question.weight,
      timeLimitSeconds: Number(question.timeLimitSeconds ?? speedSectionRow?.time_limit_seconds ?? 8),
      displayTimeSeconds: null,
      hideStimulusAfterSeconds: null,
      stimulusText: question.stimulusText ?? null,
      questionImageUrl: question.questionImageUrl ?? null,
      explanation: question.explanation ?? "",
      position: index + 1,
    });

    if (Array.isArray(question.options)) {
      for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
        const option = question.options[optionIndex];
        await upsertOption(connection, questionId, {
          key: option.key,
          text: option.text ?? null,
          imageUrl: null,
          isCorrect: option.isCorrect,
          position: optionIndex + 1,
        });
      }
    }

    if (question.overlay) {
      await upsertOverlay(connection, questionId, question.overlay);
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

  const questions = readJson("data/iq/audio-memory.json");

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const questionId = await upsertQuestion(connection, bankId, sectionId, {
      questionKey: question.questionKey,
      questionText: question.questionText ?? null,
      answerPromptText: question.answerPromptText ?? null,
      questionFormat: "text",
      difficultyLevel: question.difficultyLevel,
      weight: question.weight,
      timeLimitSeconds: null,
      displayTimeSeconds: null,
      hideStimulusAfterSeconds: null,
      stimulusText: null,
      questionImageUrl: null,
      explanation: "",
      position: index + 1,
    });

    for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
      const option = question.options[optionIndex];
      await upsertOption(connection, questionId, {
        key: option.key,
        text: `Proposition ${option.key}`,
        imageUrl: option.audioUrl,
        isCorrect: option.isCorrect,
        position: optionIndex + 1,
      });
    }

    await upsertAudioMemory(connection, questionId, {
      promptAudioUrl: question.stimulusAudioUrl,
      maxStimulusPlays: question.maxStimulusPlays,
      transitionDelayMs: question.transitionDelayMs,
    });
  }
}

// Sync generique pour les sections pilotees par un simple JSON (questions text
// et/ou overlay). Meme logique UPSERT que les autres : aucune suppression, chaque
// question/option/overlay est mise a jour en place via sa cle stable.
async function syncSimpleSection(connection, bankId, config) {
  const sectionId = await ensureSection(connection, bankId, {
    key: config.key,
    title: config.title,
    description: config.description,
    sectionType: config.sectionType,
    timeLimitSeconds: config.timeLimitSeconds ?? null,
    displayTimeSeconds: config.displayTimeSeconds ?? null,
    position: config.position,
  });

  const questions = readJson(config.file);

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const questionId = await upsertQuestion(connection, bankId, sectionId, {
      questionKey: question.questionKey,
      questionText: question.questionText ?? null,
      answerPromptText: null,
      questionFormat: question.questionFormat,
      difficultyLevel: question.difficultyLevel,
      weight: question.weight,
      timeLimitSeconds: Number(question.timeLimitSeconds ?? 45),
      displayTimeSeconds: null,
      hideStimulusAfterSeconds: null,
      stimulusText: question.stimulusText ?? null,
      questionImageUrl: question.questionImageUrl ?? null,
      explanation: question.explanation ?? "",
      position: index + 1,
    });

    if (Array.isArray(question.options)) {
      for (let optionIndex = 0; optionIndex < question.options.length; optionIndex += 1) {
        const option = question.options[optionIndex];
        await upsertOption(connection, questionId, {
          key: option.key,
          text: option.text ?? null,
          imageUrl: option.imageUrl ?? null,
          isCorrect: option.isCorrect,
          position: optionIndex + 1,
        });
      }
    }

    if (question.overlay) {
      await upsertOverlay(connection, questionId, question.overlay);
    }
  }
}

async function getExistingSection(connection, bankId, sectionKey) {
  const [[row]] = await connection.query(
    `SELECT section_type, time_limit_seconds, display_time_seconds
     FROM iq_sections
     WHERE test_id = ? AND section_key = ?
     LIMIT 1`,
    [bankId, sectionKey]
  );
  return row ?? null;
}

async function syncVerbal(connection, bankId) {
  const existing = await getExistingSection(connection, bankId, "verbal");
  await syncSimpleSection(connection, bankId, {
    key: "verbal",
    title: "Verbal",
    description: "Questions de vocabulaire, analogies et compréhension verbale.",
    sectionType: existing?.section_type ?? "verbal",
    timeLimitSeconds: existing?.time_limit_seconds ?? 1200,
    displayTimeSeconds: existing?.display_time_seconds ?? null,
    position: 3,
    file: "data/iq/verbal.json",
  });
}

async function syncLogic(connection, bankId) {
  const existing = await getExistingSection(connection, bankId, "logic");
  await syncSimpleSection(connection, bankId, {
    key: "logic",
    title: "Logique",
    description: "Questions de raisonnement logique.",
    sectionType: existing?.section_type ?? "logic",
    timeLimitSeconds: existing?.time_limit_seconds ?? 1200,
    displayTimeSeconds: existing?.display_time_seconds ?? null,
    position: 4,
    file: "data/iq/logic.json",
  });
}

async function syncSpatial(connection, bankId) {
  const existing = await getExistingSection(connection, bankId, "spatial");
  await syncSimpleSection(connection, bankId, {
    key: "spatial",
    title: "Spatial",
    description: "Questions visuelles et raisonnement spatial.",
    sectionType: existing?.section_type ?? "spatial",
    timeLimitSeconds: existing?.time_limit_seconds ?? 1200,
    displayTimeSeconds: existing?.display_time_seconds ?? null,
    position: 5,
    file: "data/iq/spatial.json",
  });
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
    await syncVerbal(connection, bankId);
    await syncLogic(connection, bankId);
    await syncSpatial(connection, bankId);
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
// 8 categories pilotees par JSON: verbal, logic, spatial, memory, quantitative, long_memory, speed, audio_memory.
