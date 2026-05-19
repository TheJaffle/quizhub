START TRANSACTION;

ALTER TABLE iq_tests
  ADD COLUMN IF NOT EXISTS sequence_definition LONGTEXT NULL AFTER total_time_limit_seconds;

UPDATE iq_tests
SET sequence_definition = '{
  "version": 1,
  "steps": [
    { "type": "question", "questionKey": "verbal-001" },
    { "type": "question", "questionKey": "logic-001" },
    { "type": "question", "questionKey": "spatial-001" },
    { "type": "question", "questionKey": "verbal-002" },
    { "type": "question", "questionKey": "logic-002" },
    { "type": "question", "questionKey": "spatial-002" },
    { "type": "question", "questionKey": "logic-003" },
    { "type": "question", "questionKey": "verbal-003" },
    { "type": "memory", "questionKeys": ["memory-001", "memory-002", "memory-003"] },
    { "type": "speed", "questionKeys": ["speed-001", "speed-004", "speed-010"], "timeLimitSeconds": 20 }
  ]
}'
WHERE slug = 'test-qi-complet';

INSERT INTO iq_tests (
  title,
  slug,
  description,
  image_url,
  total_time_limit_seconds,
  sequence_definition,
  is_active,
  created_at,
  updated_at
)
SELECT
  'Sondage',
  'sondage',
  'Parcours sondage base sur le meme referentiel de questions avec une sequence differente.',
  image_url,
  total_time_limit_seconds,
  '{
    "version": 1,
    "steps": [
      { "type": "question", "questionKey": "verbal-001" },
      { "type": "question", "questionKey": "logic-001" },
      { "type": "question", "questionKey": "spatial-001" },
      { "type": "question", "questionKey": "verbal-002" },
      { "type": "question", "questionKey": "logic-002" },
      { "type": "question", "questionKey": "spatial-002" },
      { "type": "question", "questionKey": "logic-003" },
      { "type": "question", "questionKey": "verbal-003" },
      { "type": "question", "questionKey": "verbal-004" },
      { "type": "question", "questionKey": "logic-004" },
      { "type": "question", "questionKey": "spatial-004" },
      { "type": "question", "questionKey": "verbal-005" },
      { "type": "question", "questionKey": "logic-007" },
      { "type": "question", "questionKey": "spatial-012" },
      { "type": "question", "questionKey": "logic-011" },
      { "type": "question", "questionKey": "verbal-008" },
      { "type": "memory", "questionKeys": ["memory-001", "memory-002", "memory-003"] },
      { "type": "speed", "questionKeys": ["speed-001", "speed-004", "speed-010"], "timeLimitSeconds": 20 }
    ]
  }',
  1,
  NOW(),
  NOW()
FROM iq_tests
WHERE slug = 'test-qi-complet'
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  image_url = VALUES(image_url),
  total_time_limit_seconds = VALUES(total_time_limit_seconds),
  sequence_definition = VALUES(sequence_definition),
  is_active = VALUES(is_active),
  updated_at = NOW();

SET @source_test_id := (SELECT id FROM iq_tests WHERE slug = 'test-qi-complet' LIMIT 1);
SET @target_test_id := (SELECT id FROM iq_tests WHERE slug = 'sondage' LIMIT 1);

DELETE overlay
FROM iq_spatial_overlay_questions overlay
INNER JOIN iq_questions q ON q.id = overlay.question_id
WHERE q.test_id = @target_test_id;

DELETE options_ref
FROM iq_question_options options_ref
INNER JOIN iq_questions q ON q.id = options_ref.question_id
WHERE q.test_id = @target_test_id;

DELETE FROM iq_questions
WHERE test_id = @target_test_id;

DELETE FROM iq_sections
WHERE test_id = @target_test_id;

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
  @target_test_id,
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
FROM iq_sections
WHERE test_id = @source_test_id
ORDER BY id;

INSERT INTO iq_questions (
  test_id,
  section_id,
  question_key,
  question_text,
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
  @target_test_id,
  (
    SELECT target_section.id
    FROM iq_sections target_section
    WHERE target_section.test_id = @target_test_id
      AND target_section.section_key = source_section.section_key
    LIMIT 1
  ),
  source_question.question_key,
  source_question.question_text,
  source_question.question_format,
  source_question.difficulty_level,
  source_question.weight,
  source_question.time_limit_seconds,
  source_question.display_time_seconds,
  source_question.hide_stimulus_after_seconds,
  source_question.stimulus_text,
  source_question.question_image_url,
  source_question.explanation,
  source_question.position,
  source_question.is_active,
  source_question.created_at,
  source_question.updated_at
FROM iq_questions source_question
INNER JOIN iq_sections source_section ON source_section.id = source_question.section_id
WHERE source_question.test_id = @source_test_id
ORDER BY source_question.id;

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
  target_question.id,
  source_option.option_key,
  source_option.option_text,
  source_option.option_image_url,
  source_option.is_correct,
  source_option.position,
  source_option.is_active,
  source_option.created_at,
  source_option.updated_at
FROM iq_question_options source_option
INNER JOIN iq_questions source_question ON source_question.id = source_option.question_id
INNER JOIN iq_questions target_question
  ON target_question.test_id = @target_test_id
 AND target_question.question_key = source_question.question_key
WHERE source_question.test_id = @source_test_id
ORDER BY source_option.id;

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
  target_question.id,
  source_overlay.question_image_url,
  source_overlay.answers_image_url,
  source_overlay.answer_count,
  source_overlay.grid_columns,
  source_overlay.grid_rows,
  source_overlay.correct_position,
  source_overlay.correction_text,
  source_overlay.is_active,
  source_overlay.created_at,
  source_overlay.updated_at
FROM iq_spatial_overlay_questions source_overlay
INNER JOIN iq_questions source_question ON source_question.id = source_overlay.question_id
INNER JOIN iq_questions target_question
  ON target_question.test_id = @target_test_id
 AND target_question.question_key = source_question.question_key
WHERE source_question.test_id = @source_test_id
ORDER BY source_overlay.id;

COMMIT;
