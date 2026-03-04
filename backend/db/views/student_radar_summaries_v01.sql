SELECT
  s.id AS student_id,
  s.name AS student_name,
  s.classroom_id,
  AVG(CASE WHEN ds.skill_category = 0 THEN ds.score END) AS avg_reading,
  AVG(CASE WHEN ds.skill_category = 1 THEN ds.score END) AS avg_math,
  AVG(CASE WHEN ds.skill_category = 2 THEN ds.score END) AS avg_writing,
  AVG(CASE WHEN ds.skill_category = 3 THEN ds.score END) AS avg_logic,
  AVG(CASE WHEN ds.skill_category = 4 THEN ds.score END) AS avg_social,
  COUNT(DISTINCT ds.date) AS total_days_scored,
  MIN(ds.date) AS first_score_date,
  MAX(ds.date) AS last_score_date
FROM students s
LEFT JOIN daily_scores ds ON ds.student_id = s.id
GROUP BY s.id, s.name, s.classroom_id
