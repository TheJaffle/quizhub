START TRANSACTION;

SET @has_long_memory_state_column := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'iq_attempts'
    AND COLUMN_NAME = 'long_memory_state'
);
SET @add_long_memory_state_sql := IF(
  @has_long_memory_state_column = 0,
  'ALTER TABLE iq_attempts ADD COLUMN long_memory_state LONGTEXT NULL AFTER resolved_sequence_definition',
  'SELECT 1'
);
PREPARE add_long_memory_state_stmt FROM @add_long_memory_state_sql;
EXECUTE add_long_memory_state_stmt;
DEALLOCATE PREPARE add_long_memory_state_stmt;

SET @has_long_memory_score_column := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'iq_attempts'
    AND COLUMN_NAME = 'long_memory_score'
);
SET @add_long_memory_score_sql := IF(
  @has_long_memory_score_column = 0,
  'ALTER TABLE iq_attempts ADD COLUMN long_memory_score DECIMAL(10,2) NULL AFTER quantitative_score',
  'SELECT 1'
);
PREPARE add_long_memory_score_stmt FROM @add_long_memory_score_sql;
EXECUTE add_long_memory_score_stmt;
DEALLOCATE PREPARE add_long_memory_score_stmt;

SET @has_answer_prompt_text_column := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'iq_questions'
    AND COLUMN_NAME = 'answer_prompt_text'
);
SET @add_answer_prompt_text_sql := IF(
  @has_answer_prompt_text_column = 0,
  'ALTER TABLE iq_questions ADD COLUMN answer_prompt_text TEXT NULL AFTER question_text',
  'SELECT 1'
);
PREPARE add_answer_prompt_text_stmt FROM @add_answer_prompt_text_sql;
EXECUTE add_answer_prompt_text_stmt;
DEALLOCATE PREPARE add_answer_prompt_text_stmt;

SET @question_bank_test_id := (
  SELECT COALESCE(question_bank_test_id, id)
  FROM iq_tests
  WHERE slug = 'test-qi-complet'
  LIMIT 1
);

INSERT INTO iq_sections (
  test_id,
  section_key,
  title,
  description,
  section_type,
  time_limit_seconds,
  display_time_seconds,
  position,
  is_active,
  created_at,
  updated_at
)
SELECT
  @question_bank_test_id,
  'long_memory',
  'Memoire longue',
  'Stimulus memorise puis rappel differe plus tard dans le test.',
  COALESCE(memory_section.section_type, 'memory'),
  memory_section.time_limit_seconds,
  memory_section.display_time_seconds,
  7,
  1,
  NOW(),
  NOW()
FROM iq_sections memory_section
WHERE memory_section.test_id = @question_bank_test_id
  AND memory_section.section_key = 'memory'
  AND NOT EXISTS (
    SELECT 1
    FROM iq_sections existing_section
    WHERE existing_section.test_id = @question_bank_test_id
      AND existing_section.section_key = 'long_memory'
  )
LIMIT 1;

UPDATE iq_sections
SET title = 'Memoire longue',
    description = 'Stimulus memorise puis rappel differe plus tard dans le test.',
    section_type = 'memory',
    position = 7,
    is_active = 1,
    updated_at = NOW()
WHERE test_id = @question_bank_test_id
  AND section_key = 'long_memory';

DELETE overlay
FROM iq_spatial_overlay_questions overlay
INNER JOIN iq_questions q ON q.id = overlay.question_id
INNER JOIN iq_sections s ON s.id = q.section_id
WHERE q.test_id = @question_bank_test_id
  AND s.section_key = 'long_memory';

DELETE opt
FROM iq_question_options opt
INNER JOIN iq_questions q ON q.id = opt.question_id
INNER JOIN iq_sections s ON s.id = q.section_id
WHERE q.test_id = @question_bank_test_id
  AND s.section_key = 'long_memory';

DELETE q
FROM iq_questions q
INNER JOIN iq_sections s ON s.id = q.section_id
WHERE q.test_id = @question_bank_test_id
  AND s.section_key = 'long_memory';

INSERT INTO iq_questions (
  test_id,
  section_id,
  question_key,
  question_text,
  answer_prompt_text,
  question_format,
  difficulty_level,
  weight,
  time_limit_seconds,
  display_time_seconds,
  hide_stimulus_after_seconds,
  stimulus_text,
  question_image_url,
  explanation,
  position,
  is_active,
  created_at,
  updated_at
)
SELECT
  @question_bank_test_id,
  (SELECT id FROM iq_sections WHERE test_id = @question_bank_test_id AND section_key = 'long_memory' LIMIT 1),
  question_ref.question_key,
  question_ref.question_text,
  question_ref.answer_prompt_text,
  question_ref.question_format,
  question_ref.difficulty_level,
  question_ref.weight,
  NULL,
  question_ref.display_time_seconds,
  NULL,
  question_ref.stimulus_text,
  NULL,
  question_ref.explanation,
  question_ref.position,
  1,
  NOW(),
  NOW()
FROM (
  SELECT
    'long-memory-001' AS question_key,
    'Memorisez cette sequence.' AS question_text,
    'Retrouvez la sequence qui vous a ete proposee.' AS answer_prompt_text,
    'text' AS question_format,
    1 AS difficulty_level,
    1 AS weight,
    8 AS display_time_seconds,
    '7 2 9 4 1' AS stimulus_text,
    '' AS explanation,
    1 AS position
  UNION ALL
  SELECT
    'long-memory-002',
    'Memorisez ces formes geometriques',
    'Retrouvez le symbole present dans l''image initiale.',
    'visual_overlay',
    1,
    1,
    6,
    NULL,
    '',
    2
) question_ref;

INSERT INTO iq_question_options (
  question_id,
  option_key,
  option_text,
  option_image_url,
  is_correct,
  position,
  is_active,
  created_at,
  updated_at
)
SELECT
  q.id,
  option_ref.option_key,
  option_ref.option_text,
  NULL,
  option_ref.is_correct,
  option_ref.position,
  1,
  NOW(),
  NOW()
FROM iq_questions q
INNER JOIN iq_sections s ON s.id = q.section_id
INNER JOIN (
  SELECT 'long-memory-001' AS question_key, 'A' AS option_key, '7 1 9 4 2' AS option_text, 0 AS is_correct, 1 AS position
  UNION ALL SELECT 'long-memory-001', 'B', '7 2 9 1 4', 0, 2
  UNION ALL SELECT 'long-memory-001', 'C', '2 9 7 4 1', 0, 3
  UNION ALL SELECT 'long-memory-001', 'D', '7 9 2 4 1', 1, 4
) option_ref
  ON option_ref.question_key = q.question_key
WHERE q.test_id = @question_bank_test_id
  AND s.section_key = 'long_memory';

INSERT INTO iq_spatial_overlay_questions (
  question_id,
  question_image_url,
  answers_image_url,
  answer_count,
  grid_columns,
  grid_rows,
  correct_position,
  correction_text,
  is_active,
  created_at,
  updated_at
)
SELECT
  q.id,
  '/iq/long-memory/long-memory-002-question.png',
  '/iq/long-memory/long-memory-002-answers.png',
  '4',
  2,
  2,
  2,
  '',
  1,
  NOW(),
  NOW()
FROM iq_questions q
INNER JOIN iq_sections s ON s.id = q.section_id
WHERE q.test_id = @question_bank_test_id
  AND s.section_key = 'long_memory'
  AND q.question_key = 'long-memory-002';

COMMIT;
