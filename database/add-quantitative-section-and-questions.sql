START TRANSACTION;

SET @test_debug_id := (SELECT id FROM iq_tests WHERE slug = 'test-qi-complet' LIMIT 1);
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
  source.test_id,
  'quantitative',
  'Quantitatif',
  'Questions de calcul et resolution de problemes quantitatifs.',
  COALESCE(logic_section.section_type, 'standard'),
  logic_section.time_limit_seconds,
  logic_section.display_time_seconds,
  6,
  1,
  NOW(),
  NOW()
FROM (
  SELECT @question_bank_test_id AS test_id
) source
LEFT JOIN iq_sections logic_section
  ON logic_section.test_id = source.test_id
 AND logic_section.section_key = 'logic'
WHERE source.test_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM iq_sections existing_section
    WHERE existing_section.test_id = source.test_id
      AND existing_section.section_key = 'quantitative'
  );

UPDATE iq_sections
SET title = 'Quantitatif',
    description = 'Questions de calcul et resolution de problemes quantitatifs.',
    position = 6,
    is_active = 1,
    updated_at = NOW()
WHERE section_key = 'quantitative'
  AND test_id = @question_bank_test_id;

DELETE overlay
FROM iq_spatial_overlay_questions overlay
INNER JOIN iq_questions q ON q.id = overlay.question_id
INNER JOIN iq_sections s ON s.id = q.section_id
WHERE q.test_id = @question_bank_test_id
  AND s.section_key = 'quantitative';

DELETE opt
FROM iq_question_options opt
INNER JOIN iq_questions q ON q.id = opt.question_id
INNER JOIN iq_sections s ON s.id = q.section_id
WHERE q.test_id = @question_bank_test_id
  AND s.section_key = 'quantitative';

DELETE q
FROM iq_questions q
INNER JOIN iq_sections s ON s.id = q.section_id
WHERE q.test_id = @question_bank_test_id
  AND s.section_key = 'quantitative';

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
  section_ref.test_id,
  section_ref.section_id,
  question_ref.question_key,
  question_ref.question_text,
  question_ref.question_format,
  question_ref.difficulty_level,
  question_ref.weight,
  question_ref.time_limit_seconds,
  NULL,
  NULL,
  NULL,
  NULL,
  question_ref.explanation,
  question_ref.position,
  1,
  NOW(),
  NOW()
FROM (
  SELECT @question_bank_test_id AS test_id, (SELECT id FROM iq_sections WHERE test_id = @question_bank_test_id AND section_key = 'quantitative' LIMIT 1) AS section_id
) section_ref
INNER JOIN (
  SELECT 'quantitative-001' AS question_key, '4 machines fabriquent 24 pieces en 6 minutes. A la meme vitesse, combien de pieces fabriqueront 8 machines en 3 minutes ?' AS question_text, 'text' AS question_format, 1 AS difficulty_level, 1 AS weight, 45 AS time_limit_seconds, 'Doubler machines x2. Diviser temps /2. Effets s''annulent.' AS explanation, 1 AS position
  UNION ALL
  SELECT 'quantitative-002', 'Dans un groupe le ratio hommes/femmes est 3:2. Il y a 20 femmes. Combien y a-t-il d''hommes ?', 'text', 1, 1, 45, '', 2
  UNION ALL
  SELECT 'quantitative-003', '', 'visual_overlay', 1, 1, 45, '', 3
  UNION ALL
  SELECT 'quantitative-004', 'Une population augmente de 50%, puis diminue de 50%. Par rapport au depart, elle est :', 'text', 1, 1, 45, '', 4
  UNION ALL
  SELECT 'quantitative-005', 'Un objet coute 120 EUR apres une reduction de 20%. Quel etait son prix initial ?', 'text', 1, 1, 45, '', 5
  UNION ALL
  SELECT 'quantitative-006', '', 'visual_overlay', 1, 1, 45, '', 6
  UNION ALL
  SELECT 'quantitative-007', 'Si 5 personnes terminent un travail en 12 jours, combien faudra-t-il de jours a 15 personnes ?', 'text', 1, 1, 45, '', 7
  UNION ALL
  SELECT 'quantitative-008', 'La moyenne de 5 nombres est 18. Quatre nombres valent : 12, 15, 20 et 23. Le cinquieme vaut :', 'text', 1, 1, 45, '', 8
  UNION ALL
  SELECT 'quantitative-009', '', 'visual_overlay', 1, 1, 45, '', 9
  UNION ALL
  SELECT 'quantitative-010', 'Une feuille est pliee en deux 4 fois. Son epaisseur est multipliee par :', 'text', 1, 1, 45, '', 10
) question_ref
WHERE section_ref.test_id IS NOT NULL
  AND section_ref.section_id IS NOT NULL
ORDER BY section_ref.test_id, question_ref.position;

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
  SELECT 'quantitative-001' AS question_key, 'A' AS option_key, '24' AS option_text, 1 AS is_correct, 1 AS position
  UNION ALL SELECT 'quantitative-001', 'B', '36', 0, 2
  UNION ALL SELECT 'quantitative-001', 'C', '48', 0, 3
  UNION ALL SELECT 'quantitative-001', 'D', '96', 0, 4
  UNION ALL SELECT 'quantitative-002', 'A', '25', 0, 1
  UNION ALL SELECT 'quantitative-002', 'B', '30', 1, 2
  UNION ALL SELECT 'quantitative-002', 'C', '35', 0, 3
  UNION ALL SELECT 'quantitative-002', 'D', '40', 0, 4
  UNION ALL SELECT 'quantitative-004', 'A', 'identique', 0, 1
  UNION ALL SELECT 'quantitative-004', 'B', 'plus grande', 0, 2
  UNION ALL SELECT 'quantitative-004', 'C', 'plus petite', 1, 3
  UNION ALL SELECT 'quantitative-004', 'D', 'impossible a savoir', 0, 4
  UNION ALL SELECT 'quantitative-005', 'A', '140', 0, 1
  UNION ALL SELECT 'quantitative-005', 'B', '144', 0, 2
  UNION ALL SELECT 'quantitative-005', 'C', '150', 1, 3
  UNION ALL SELECT 'quantitative-005', 'D', '160', 0, 4
  UNION ALL SELECT 'quantitative-007', 'A', '2', 0, 1
  UNION ALL SELECT 'quantitative-007', 'B', '4', 1, 2
  UNION ALL SELECT 'quantitative-007', 'C', '6', 0, 3
  UNION ALL SELECT 'quantitative-007', 'D', '8', 0, 4
  UNION ALL SELECT 'quantitative-008', 'A', '18', 0, 1
  UNION ALL SELECT 'quantitative-008', 'B', '20', 1, 2
  UNION ALL SELECT 'quantitative-008', 'C', '22', 0, 3
  UNION ALL SELECT 'quantitative-008', 'D', '24', 0, 4
  UNION ALL SELECT 'quantitative-010', 'A', '4', 0, 1
  UNION ALL SELECT 'quantitative-010', 'B', '8', 0, 2
  UNION ALL SELECT 'quantitative-010', 'C', '16', 1, 3
  UNION ALL SELECT 'quantitative-010', 'D', '32', 0, 4
) option_ref
  ON option_ref.question_key = q.question_key
WHERE q.test_id = @question_bank_test_id
  AND s.section_key = 'quantitative'
ORDER BY q.test_id, q.position, option_ref.position;

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
  overlay_ref.question_image_url,
  overlay_ref.answers_image_url,
  '4',
  2,
  2,
  overlay_ref.correct_position,
  '',
  1,
  NOW(),
  NOW()
FROM iq_questions q
INNER JOIN iq_sections s ON s.id = q.section_id
INNER JOIN (
  SELECT 'quantitative-003' AS question_key, '/iq/quantitative/quantitative-003-question.png' AS question_image_url, '/iq/quantitative/quantitative-003-answer.png' AS answers_image_url, 2 AS correct_position
  UNION ALL
  SELECT 'quantitative-006', '/iq/quantitative/quantitative-006-question.png', '/iq/quantitative/quantitative-006-answer.png', 1
  UNION ALL
  SELECT 'quantitative-009', '/iq/quantitative/quantitative-009-question.png', '/iq/quantitative/quantitative-009-answer.png', 3
) overlay_ref
  ON overlay_ref.question_key = q.question_key
WHERE q.test_id = @question_bank_test_id
  AND s.section_key = 'quantitative'
ORDER BY q.test_id, q.position;

COMMIT;
