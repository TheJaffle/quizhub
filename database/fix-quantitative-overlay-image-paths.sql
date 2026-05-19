UPDATE iq_spatial_overlay_questions overlay
INNER JOIN iq_questions q ON q.id = overlay.question_id
SET overlay.answers_image_url = CASE q.question_key
  WHEN 'quantitative-003' THEN '/iq/quantitative/quantitative-003-answer.png'
  WHEN 'quantitative-006' THEN '/iq/quantitative/quantitative-006-answer.png'
  WHEN 'quantitative-009' THEN '/iq/quantitative/quantitative-009-answer.png'
  ELSE overlay.answers_image_url
END
WHERE q.question_key IN ('quantitative-003', 'quantitative-006', 'quantitative-009');
