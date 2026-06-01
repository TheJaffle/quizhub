INSERT INTO iq_question_options
  (question_id, option_key, option_text, option_image_url, is_correct, position, is_active)
SELECT
  q.id,
  pos.option_key,
  CONCAT('Reponse ', pos.option_key),
  NULL,
  0,
  pos.position,
  CASE WHEN pos.position <= targets.option_count THEN 1 ELSE 0 END
FROM iq_questions q
INNER JOIN (
  SELECT 'logic-010' AS question_key, 4 AS option_count, 4 AS answer_count, 1 AS correct_position
  UNION ALL SELECT 'logic-011', 4, 4, 1
  UNION ALL SELECT 'logic-012', 4, 4, 3
  UNION ALL SELECT 'logic-018', 6, 6, 6
  UNION ALL SELECT 'logic-021', 4, 4, 3
  UNION ALL SELECT 'logic-022', 6, 6, 5
  UNION ALL SELECT 'logic-023', 6, 6, 6
  UNION ALL SELECT 'logic-024', 6, 6, 3
  UNION ALL SELECT 'logic-025', 4, 4, 2
  UNION ALL SELECT 'spatial-001', 4, 4, 2
  UNION ALL SELECT 'spatial-003', 4, 4, 2
  UNION ALL SELECT 'spatial-004', 6, 6, 3
  UNION ALL SELECT 'spatial-005', 6, 6, 6
  UNION ALL SELECT 'spatial-006', 6, 6, 1
  UNION ALL SELECT 'spatial-007', 4, 4, 1
  UNION ALL SELECT 'spatial-008', 4, 4, 3
  UNION ALL SELECT 'spatial-009', 4, 4, 3
  UNION ALL SELECT 'spatial-010', 4, 4, 2
  UNION ALL SELECT 'spatial-011', 4, 4, 3
  UNION ALL SELECT 'spatial-012', 4, 4, 1
  UNION ALL SELECT 'spatial-013', 4, 4, 3
  UNION ALL SELECT 'spatial-014', 4, 4, 4
  UNION ALL SELECT 'spatial-015', 4, 4, 2
  UNION ALL SELECT 'spatial-016', 4, 4, 3
  UNION ALL SELECT 'spatial-017', 4, 4, 3
  UNION ALL SELECT 'quantitative-003', 4, 4, 2
  UNION ALL SELECT 'quantitative-006', 4, 4, 3
  UNION ALL SELECT 'quantitative-009', 4, 4, 3
  UNION ALL SELECT 'memory-002', 4, 4, 2
  UNION ALL SELECT 'memory-003', 4, 4, 3
  UNION ALL SELECT 'memory-004', 4, 4, 2
  UNION ALL SELECT 'memory-006', 4, 4, 3
  UNION ALL SELECT 'memory-007', 4, 4, 2
  UNION ALL SELECT 'memory-008', 4, 4, 2
  UNION ALL SELECT 'memory-009', 4, 4, 2
  UNION ALL SELECT 'memory-010', 4, 4, 2
) targets ON targets.question_key = q.question_key
INNER JOIN (
  SELECT 1 AS position, 'A' AS option_key
  UNION ALL SELECT 2, 'B'
  UNION ALL SELECT 3, 'C'
  UNION ALL SELECT 4, 'D'
  UNION ALL SELECT 5, 'E'
  UNION ALL SELECT 6, 'F'
) pos
LEFT JOIN iq_question_options existing
  ON existing.question_id = q.id
 AND existing.position = pos.position
WHERE existing.id IS NULL;

UPDATE iq_question_options opt
INNER JOIN iq_questions q ON q.id = opt.question_id
INNER JOIN (
  SELECT 'logic-010' AS question_key, 4 AS option_count, 4 AS answer_count, 1 AS correct_position
  UNION ALL SELECT 'logic-011', 4, 4, 1
  UNION ALL SELECT 'logic-012', 4, 4, 3
  UNION ALL SELECT 'logic-018', 6, 6, 6
  UNION ALL SELECT 'logic-021', 4, 4, 3
  UNION ALL SELECT 'logic-022', 6, 6, 5
  UNION ALL SELECT 'logic-023', 6, 6, 6
  UNION ALL SELECT 'logic-024', 6, 6, 3
  UNION ALL SELECT 'logic-025', 4, 4, 2
  UNION ALL SELECT 'spatial-001', 4, 4, 2
  UNION ALL SELECT 'spatial-003', 4, 4, 2
  UNION ALL SELECT 'spatial-004', 6, 6, 3
  UNION ALL SELECT 'spatial-005', 6, 6, 6
  UNION ALL SELECT 'spatial-006', 6, 6, 1
  UNION ALL SELECT 'spatial-007', 4, 4, 1
  UNION ALL SELECT 'spatial-008', 4, 4, 3
  UNION ALL SELECT 'spatial-009', 4, 4, 3
  UNION ALL SELECT 'spatial-010', 4, 4, 2
  UNION ALL SELECT 'spatial-011', 4, 4, 3
  UNION ALL SELECT 'spatial-012', 4, 4, 1
  UNION ALL SELECT 'spatial-013', 4, 4, 3
  UNION ALL SELECT 'spatial-014', 4, 4, 4
  UNION ALL SELECT 'spatial-015', 4, 4, 2
  UNION ALL SELECT 'spatial-016', 4, 4, 3
  UNION ALL SELECT 'spatial-017', 4, 4, 3
  UNION ALL SELECT 'quantitative-003', 4, 4, 2
  UNION ALL SELECT 'quantitative-006', 4, 4, 3
  UNION ALL SELECT 'quantitative-009', 4, 4, 3
  UNION ALL SELECT 'memory-002', 4, 4, 2
  UNION ALL SELECT 'memory-003', 4, 4, 3
  UNION ALL SELECT 'memory-004', 4, 4, 2
  UNION ALL SELECT 'memory-006', 4, 4, 3
  UNION ALL SELECT 'memory-007', 4, 4, 2
  UNION ALL SELECT 'memory-008', 4, 4, 2
  UNION ALL SELECT 'memory-009', 4, 4, 2
  UNION ALL SELECT 'memory-010', 4, 4, 2
) targets ON targets.question_key = q.question_key
SET opt.is_active = CASE WHEN opt.position <= targets.option_count THEN 1 ELSE 0 END,
    opt.option_image_url = NULL,
    opt.is_correct = CASE
      WHEN opt.position = targets.correct_position AND opt.position <= targets.option_count THEN 1
      ELSE 0
    END
WHERE q.question_key IN (
  'logic-010','logic-011','logic-012','logic-018','logic-021','logic-022','logic-023','logic-024','logic-025',
  'spatial-001','spatial-003','spatial-004','spatial-005','spatial-006','spatial-007','spatial-008','spatial-009',
  'spatial-010','spatial-011','spatial-012','spatial-013','spatial-014','spatial-015','spatial-016','spatial-017',
  'quantitative-003','quantitative-006','quantitative-009',
  'memory-002','memory-003','memory-004','memory-006','memory-007','memory-008','memory-009','memory-010'
);

UPDATE iq_spatial_overlay_questions overlay
INNER JOIN iq_questions q ON q.id = overlay.question_id
INNER JOIN (
  SELECT 'logic-010' AS question_key, 4 AS option_count, 4 AS answer_count, 1 AS correct_position
  UNION ALL SELECT 'logic-011', 4, 4, 1
  UNION ALL SELECT 'logic-012', 4, 4, 3
  UNION ALL SELECT 'logic-018', 6, 6, 6
  UNION ALL SELECT 'logic-021', 4, 4, 3
  UNION ALL SELECT 'logic-022', 6, 6, 5
  UNION ALL SELECT 'logic-023', 6, 6, 6
  UNION ALL SELECT 'logic-024', 6, 6, 3
  UNION ALL SELECT 'logic-025', 4, 4, 2
  UNION ALL SELECT 'spatial-001', 4, 4, 2
  UNION ALL SELECT 'spatial-003', 4, 4, 2
  UNION ALL SELECT 'spatial-004', 6, 6, 3
  UNION ALL SELECT 'spatial-005', 6, 6, 6
  UNION ALL SELECT 'spatial-006', 6, 6, 1
  UNION ALL SELECT 'spatial-007', 4, 4, 1
  UNION ALL SELECT 'spatial-008', 4, 4, 3
  UNION ALL SELECT 'spatial-009', 4, 4, 3
  UNION ALL SELECT 'spatial-010', 4, 4, 2
  UNION ALL SELECT 'spatial-011', 4, 4, 3
  UNION ALL SELECT 'spatial-012', 4, 4, 1
  UNION ALL SELECT 'spatial-013', 4, 4, 3
  UNION ALL SELECT 'spatial-014', 4, 4, 4
  UNION ALL SELECT 'spatial-015', 4, 4, 2
  UNION ALL SELECT 'spatial-016', 4, 4, 3
  UNION ALL SELECT 'spatial-017', 4, 4, 3
  UNION ALL SELECT 'quantitative-003', 4, 4, 2
  UNION ALL SELECT 'quantitative-006', 4, 4, 3
  UNION ALL SELECT 'quantitative-009', 4, 4, 3
) targets ON targets.question_key = q.question_key
SET overlay.answer_count = CAST(targets.answer_count AS CHAR),
    overlay.correct_position = targets.correct_position
WHERE q.question_key IN (
  'logic-010','logic-011','logic-012','logic-018','logic-021','logic-022','logic-023','logic-024','logic-025',
  'spatial-001','spatial-003','spatial-004','spatial-005','spatial-006','spatial-007','spatial-008','spatial-009',
  'spatial-010','spatial-011','spatial-012','spatial-013','spatial-014','spatial-015','spatial-016','spatial-017',
  'quantitative-003','quantitative-006','quantitative-009'
);
