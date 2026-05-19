START TRANSACTION;

SET @has_audio_memory_score_column := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'iq_attempts'
    AND COLUMN_NAME = 'audio_memory_score'
);
SET @add_audio_memory_score_sql := IF(
  @has_audio_memory_score_column = 0,
  'ALTER TABLE iq_attempts ADD COLUMN audio_memory_score DECIMAL(10,2) NULL AFTER quantitative_score',
  'SELECT 1'
);
PREPARE add_audio_memory_score_stmt FROM @add_audio_memory_score_sql;
EXECUTE add_audio_memory_score_stmt;
DEALLOCATE PREPARE add_audio_memory_score_stmt;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  'audio_memory',
  'Sonore',
  'Questions de memoire auditive avec ecoute initiale puis rappel parmi plusieurs propositions audio.',
  'memory',
  NULL,
  NULL,
  8,
  1,
  NOW(),
  NOW()
WHERE @question_bank_test_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM iq_sections existing_section
    WHERE existing_section.test_id = @question_bank_test_id
      AND existing_section.section_key = 'audio_memory'
  );

UPDATE iq_sections
SET title = 'Sonore',
    description = 'Questions de memoire auditive avec ecoute initiale puis rappel parmi plusieurs propositions audio.',
    section_type = 'memory',
    position = 8,
    is_active = 1,
    updated_at = NOW()
WHERE test_id = @question_bank_test_id
  AND section_key = 'audio_memory';

SET @section_id := (
  SELECT id
  FROM iq_sections
  WHERE test_id = @question_bank_test_id
    AND section_key = 'audio_memory'
  LIMIT 1
);

DELETE audio
FROM iq_audio_memory_questions audio
INNER JOIN iq_questions q ON q.id = audio.question_id
WHERE q.test_id = @question_bank_test_id
  AND q.section_id = @section_id;

DELETE opt
FROM iq_question_options opt
INNER JOIN iq_questions q ON q.id = opt.question_id
WHERE q.test_id = @question_bank_test_id
  AND q.section_id = @section_id;

DELETE FROM iq_questions
WHERE test_id = @question_bank_test_id
  AND section_id = @section_id;

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
  @section_id,
  question_ref.question_key,
  question_ref.question_text,
  question_ref.answer_prompt_text,
  'text',
  question_ref.difficulty_level,
  question_ref.weight,
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  '',
  question_ref.position,
  1,
  NOW(),
  NOW()
FROM (
  SELECT 'audio-memory-001' AS question_key, 'Ecoutez attentivement.' AS question_text, 'Quelle sequence avez-vous entendue ?' AS answer_prompt_text, 1 AS difficulty_level, 1 AS weight, 1 AS position
  UNION ALL SELECT 'audio-memory-002', 'Ecoutez attentivement.', 'Quelle sequence avez-vous entendue ?', 1, 1, 2
  UNION ALL SELECT 'audio-memory-003', 'Ecoutez attentivement.', 'Quelle sequence avez-vous entendue ?', 1, 1, 3
  UNION ALL SELECT 'audio-memory-004', 'Ecoutez attentivement.', 'Quelle sequence avez-vous entendue ?', 1, 1, 4
  UNION ALL SELECT 'audio-memory-005', 'Ecoutez attentivement.', 'Quelle sequence avez-vous entendue ?', 1, 1, 5
  UNION ALL SELECT 'audio-memory-006', 'Ecoutez attentivement.', 'Quelle sequence avez-vous entendue ?', 1, 1, 6
  UNION ALL SELECT 'audio-memory-007', 'Ecoutez attentivement.', 'Quelle sequence avez-vous entendue ?', 1, 1, 7
) question_ref
WHERE @question_bank_test_id IS NOT NULL
  AND @section_id IS NOT NULL
ORDER BY question_ref.position;

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
  CONCAT('Proposition ', option_ref.option_key),
  option_ref.audio_url,
  option_ref.is_correct,
  option_ref.position,
  1,
  NOW(),
  NOW()
FROM iq_questions q
INNER JOIN (
  SELECT 'audio-memory-001' AS question_key, 'A' AS option_key, '/iq/audio-memory/audio-memory-001-a.wav' AS audio_url, 1 AS is_correct, 1 AS position
  UNION ALL SELECT 'audio-memory-001', 'B', '/iq/audio-memory/audio-memory-001-b.wav', 0, 2
  UNION ALL SELECT 'audio-memory-001', 'C', '/iq/audio-memory/audio-memory-001-c.wav', 0, 3
  UNION ALL SELECT 'audio-memory-001', 'D', '/iq/audio-memory/audio-memory-001-d.wav', 0, 4
  UNION ALL SELECT 'audio-memory-002', 'A', '/iq/audio-memory/audio-memory-002-a.wav', 0, 1
  UNION ALL SELECT 'audio-memory-002', 'B', '/iq/audio-memory/audio-memory-002-b.wav', 1, 2
  UNION ALL SELECT 'audio-memory-002', 'C', '/iq/audio-memory/audio-memory-002-c.wav', 0, 3
  UNION ALL SELECT 'audio-memory-002', 'D', '/iq/audio-memory/audio-memory-002-d.wav', 0, 4
  UNION ALL SELECT 'audio-memory-003', 'A', '/iq/audio-memory/audio-memory-003-a.wav', 0, 1
  UNION ALL SELECT 'audio-memory-003', 'B', '/iq/audio-memory/audio-memory-003-b.wav', 0, 2
  UNION ALL SELECT 'audio-memory-003', 'C', '/iq/audio-memory/audio-memory-003-c.wav', 0, 3
  UNION ALL SELECT 'audio-memory-003', 'D', '/iq/audio-memory/audio-memory-003-d.wav', 1, 4
  UNION ALL SELECT 'audio-memory-004', 'A', '/iq/audio-memory/audio-memory-004-a.wav', 1, 1
  UNION ALL SELECT 'audio-memory-004', 'B', '/iq/audio-memory/audio-memory-004-b.wav', 0, 2
  UNION ALL SELECT 'audio-memory-004', 'C', '/iq/audio-memory/audio-memory-004-c.wav', 0, 3
  UNION ALL SELECT 'audio-memory-004', 'D', '/iq/audio-memory/audio-memory-004-d.wav', 0, 4
  UNION ALL SELECT 'audio-memory-005', 'A', '/iq/audio-memory/audio-memory-005-a.wav', 0, 1
  UNION ALL SELECT 'audio-memory-005', 'B', '/iq/audio-memory/audio-memory-005-b.wav', 0, 2
  UNION ALL SELECT 'audio-memory-005', 'C', '/iq/audio-memory/audio-memory-005-c.wav', 1, 3
  UNION ALL SELECT 'audio-memory-005', 'D', '/iq/audio-memory/audio-memory-005-d.wav', 0, 4
  UNION ALL SELECT 'audio-memory-006', 'A', '/iq/audio-memory/audio-memory-006-a.wav', 0, 1
  UNION ALL SELECT 'audio-memory-006', 'B', '/iq/audio-memory/audio-memory-006-b.wav', 0, 2
  UNION ALL SELECT 'audio-memory-006', 'C', '/iq/audio-memory/audio-memory-006-c.wav', 0, 3
  UNION ALL SELECT 'audio-memory-006', 'D', '/iq/audio-memory/audio-memory-006-d.wav', 1, 4
  UNION ALL SELECT 'audio-memory-007', 'A', '/iq/audio-memory/audio-memory-007-a.wav', 0, 1
  UNION ALL SELECT 'audio-memory-007', 'B', '/iq/audio-memory/audio-memory-007-b.wav', 1, 2
  UNION ALL SELECT 'audio-memory-007', 'C', '/iq/audio-memory/audio-memory-007-c.wav', 0, 3
  UNION ALL SELECT 'audio-memory-007', 'D', '/iq/audio-memory/audio-memory-007-d.wav', 0, 4
) option_ref
  ON option_ref.question_key = q.question_key
WHERE q.test_id = @question_bank_test_id
  AND q.section_id = @section_id
ORDER BY q.position, option_ref.position;

INSERT INTO iq_audio_memory_questions (
  question_id,
  prompt_audio_url,
  max_stimulus_plays,
  transition_delay_ms,
  created_at,
  updated_at
)
SELECT
  q.id,
  audio_ref.prompt_audio_url,
  audio_ref.max_stimulus_plays,
  audio_ref.transition_delay_ms,
  NOW(),
  NOW()
FROM iq_questions q
INNER JOIN (
  SELECT 'audio-memory-001' AS question_key, '/iq/audio-memory/audio-memory-001-stimulus.wav' AS prompt_audio_url, 1 AS max_stimulus_plays, 1800 AS transition_delay_ms
  UNION ALL SELECT 'audio-memory-002', '/iq/audio-memory/audio-memory-002-stimulus.wav', 1, 1800
  UNION ALL SELECT 'audio-memory-003', '/iq/audio-memory/audio-memory-003-stimulus.wav', 1, 1800
  UNION ALL SELECT 'audio-memory-004', '/iq/audio-memory/audio-memory-004-stimulus.wav', 1, 1800
  UNION ALL SELECT 'audio-memory-005', '/iq/audio-memory/audio-memory-005-stimulus.wav', 1, 1800
  UNION ALL SELECT 'audio-memory-006', '/iq/audio-memory/audio-memory-006-stimulus.wav', 1, 1800
  UNION ALL SELECT 'audio-memory-007', '/iq/audio-memory/audio-memory-007-stimulus.wav', 1, 1800
) audio_ref
  ON audio_ref.question_key = q.question_key
WHERE q.test_id = @question_bank_test_id
  AND q.section_id = @section_id
ORDER BY q.position;

COMMIT;
