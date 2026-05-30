START TRANSACTION;

UPDATE iq_questions
SET question_image_url = CASE question_key
  WHEN 'logic-009' THEN '/iq/logique/logique-009-question.png'
  WHEN 'logic-010' THEN '/iq/logique/logique-010-question.png'
  WHEN 'logic-011' THEN '/iq/logique/logique-011-question.png'
  WHEN 'logic-012' THEN '/iq/logique/logique-012-question.png'
  WHEN 'logic-018' THEN '/iq/logique/logique-018-question.png'
  WHEN 'logic-019' THEN '/iq/logique/logique-019-question.png'
  WHEN 'logic-020' THEN '/iq/logique/logique-020-question.png'
  WHEN 'logic-021' THEN '/iq/logique/logique-021-question.png'
  WHEN 'logic-022' THEN '/iq/logique/logique-022-question.png'
  WHEN 'logic-023' THEN '/iq/logique/logique-023-question.png'
  WHEN 'logic-024' THEN '/iq/logique/logique-024-question.png'
  WHEN 'logic-025' THEN '/iq/logique/logique-025-question.png'
  ELSE question_image_url
END
WHERE test_id = 1
  AND question_key IN (
    'logic-009', 'logic-010', 'logic-011', 'logic-012',
    'logic-018', 'logic-019', 'logic-020',
    'logic-021', 'logic-022', 'logic-023', 'logic-024', 'logic-025'
  );

UPDATE iq_spatial_overlay_questions overlay
INNER JOIN iq_questions q ON q.id = overlay.question_id
SET overlay.question_image_url = CASE q.question_key
      WHEN 'logic-009' THEN '/iq/logique/logique-009-question.png'
      WHEN 'logic-010' THEN '/iq/logique/logique-010-question.png'
      WHEN 'logic-011' THEN '/iq/logique/logique-011-question.png'
      WHEN 'logic-012' THEN '/iq/logique/logique-012-question.png'
      WHEN 'logic-018' THEN '/iq/logique/logique-018-question.png'
      WHEN 'logic-019' THEN '/iq/logique/logique-019-question.png'
      WHEN 'logic-020' THEN '/iq/logique/logique-020-question.png'
      WHEN 'logic-021' THEN '/iq/logique/logique-021-question.png'
      WHEN 'logic-022' THEN '/iq/logique/logique-022-question.png'
      WHEN 'logic-023' THEN '/iq/logique/logique-023-question.png'
      WHEN 'logic-024' THEN '/iq/logique/logique-024-question.png'
      WHEN 'logic-025' THEN '/iq/logique/logique-025-question.png'
      ELSE overlay.question_image_url
    END,
    overlay.answers_image_url = CASE q.question_key
      WHEN 'logic-009' THEN '/iq/logique/logique-009-answers.png'
      WHEN 'logic-010' THEN '/iq/logique/logique-010-answers.png'
      WHEN 'logic-011' THEN '/iq/logique/logique-011-answers.png'
      WHEN 'logic-012' THEN '/iq/logique/logique-012-answers.png'
      WHEN 'logic-018' THEN '/iq/logique/logique-018-answers.png'
      WHEN 'logic-019' THEN '/iq/logique/logique-019-answers.png'
      WHEN 'logic-020' THEN '/iq/logique/logique-020-answers.png'
      WHEN 'logic-021' THEN '/iq/logique/logique-021-answers.png'
      WHEN 'logic-022' THEN '/iq/logique/logique-022-answers.png'
      WHEN 'logic-023' THEN '/iq/logique/logique-023-answers.png'
      WHEN 'logic-024' THEN '/iq/logique/logique-024-answers.png'
      WHEN 'logic-025' THEN '/iq/logique/logique-025-answers.png'
      ELSE overlay.answers_image_url
    END
WHERE q.test_id = 1
  AND q.question_key IN (
    'logic-009', 'logic-010', 'logic-011', 'logic-012',
    'logic-018', 'logic-019', 'logic-020',
    'logic-021', 'logic-022', 'logic-023', 'logic-024', 'logic-025'
  );

UPDATE iq_question_options opt
INNER JOIN iq_questions q ON q.id = opt.question_id
SET opt.option_image_url = NULL
WHERE q.test_id = 1
  AND q.question_key IN (
    'logic-009', 'logic-010', 'logic-011', 'logic-012',
    'logic-018', 'logic-019', 'logic-020',
    'logic-021', 'logic-022', 'logic-023', 'logic-024', 'logic-025'
  );

COMMIT;
