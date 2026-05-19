START TRANSACTION;

SET @has_question_bank_column := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'iq_tests'
    AND COLUMN_NAME = 'question_bank_test_id'
);
SET @add_question_bank_sql := IF(
  @has_question_bank_column = 0,
  'ALTER TABLE iq_tests ADD COLUMN question_bank_test_id BIGINT UNSIGNED NULL AFTER sequence_definition',
  'SELECT 1'
);
PREPARE add_question_bank_stmt FROM @add_question_bank_sql;
EXECUTE add_question_bank_stmt;
DEALLOCATE PREPARE add_question_bank_stmt;

SET @source_test_id := (SELECT id FROM iq_tests WHERE slug = 'test-qi-complet' LIMIT 1);
SET @target_test_id := (SELECT id FROM iq_tests WHERE slug = 'sondage' LIMIT 1);

UPDATE iq_tests
SET question_bank_test_id = id
WHERE question_bank_test_id IS NULL
  AND id = @source_test_id;

UPDATE iq_tests
SET question_bank_test_id = @source_test_id
WHERE id = @target_test_id;

UPDATE iq_attempt_answers aa
INNER JOIN iq_attempts a ON a.id = aa.attempt_id
INNER JOIN iq_tests t ON t.id = a.test_id
INNER JOIN iq_questions old_q ON old_q.id = aa.question_id
INNER JOIN iq_sections old_s ON old_s.id = aa.section_id
INNER JOIN iq_questions new_q
  ON new_q.test_id = t.question_bank_test_id
 AND new_q.question_key = old_q.question_key
INNER JOIN iq_sections new_s
  ON new_s.test_id = t.question_bank_test_id
 AND new_s.section_key = old_s.section_key
SET aa.question_id = new_q.id,
    aa.section_id = new_s.id
WHERE t.question_bank_test_id IS NOT NULL
  AND t.question_bank_test_id <> t.id;

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

COMMIT;
