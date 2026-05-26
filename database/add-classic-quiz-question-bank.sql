START TRANSACTION;

CREATE TABLE IF NOT EXISTS quiz_topics (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id INT(10) UNSIGNED NOT NULL,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  description TEXT NULL,
  image_url VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_quiz_topics_slug (slug),
  KEY idx_quiz_topics_category_active (category_id, is_active),
  CONSTRAINT fk_quiz_topics_category
    FOREIGN KEY (category_id) REFERENCES quiz_categories(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_bank (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  topic_id INT(10) UNSIGNED NOT NULL,
  difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
  question_key VARCHAR(190) NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
  image_url VARCHAR(255) NULL,
  explanation TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_question_bank_topic_difficulty_key (topic_id, difficulty, question_key),
  KEY idx_question_bank_topic_difficulty_active (topic_id, difficulty, is_active),
  CONSTRAINT fk_question_bank_topic
    FOREIGN KEY (topic_id) REFERENCES quiz_topics(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS question_bank_answers (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  question_id INT(10) UNSIGNED NOT NULL,
  answer_key ENUM('A', 'B', 'C', 'D') NOT NULL,
  answer_text TEXT NOT NULL,
  image_url VARCHAR(255) NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  position TINYINT(3) UNSIGNED NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  correct_question_id INT(10) UNSIGNED GENERATED ALWAYS AS (
    CASE WHEN is_correct = 1 THEN question_id ELSE NULL END
  ) STORED,
  PRIMARY KEY (id),
  UNIQUE KEY uq_question_bank_answers_question_key (question_id, answer_key),
  UNIQUE KEY uq_question_bank_answers_question_position (question_id, position),
  UNIQUE KEY uq_question_bank_answers_one_correct (correct_question_id),
  KEY idx_question_bank_answers_question_correct (question_id, is_correct),
  CONSTRAINT fk_question_bank_answers_question
    FOREIGN KEY (question_id) REFERENCES question_bank(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_sessions (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  session_token CHAR(36) NOT NULL,
  result_token CHAR(36) NULL,
  user_id INT(10) UNSIGNED NULL,
  guest_token CHAR(36) NULL,
  topic_id INT(10) UNSIGNED NOT NULL,
  difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
  question_count TINYINT(3) UNSIGNED NOT NULL DEFAULT 20,
  score TINYINT(3) UNSIGNED NULL,
  total_questions TINYINT(3) UNSIGNED NOT NULL DEFAULT 0,
  percentage DECIMAL(5,2) NULL,
  duration_seconds INT(10) UNSIGNED NULL,
  status ENUM('started', 'finished', 'abandoned') NOT NULL DEFAULT 'started',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_quiz_sessions_session_token (session_token),
  UNIQUE KEY uq_quiz_sessions_result_token (result_token),
  KEY idx_quiz_sessions_user_topic_difficulty (user_id, topic_id, difficulty),
  KEY idx_quiz_sessions_guest_topic_difficulty (guest_token, topic_id, difficulty),
  KEY idx_quiz_sessions_topic_difficulty_status (topic_id, difficulty, status),
  CONSTRAINT fk_quiz_sessions_topic
    FOREIGN KEY (topic_id) REFERENCES quiz_topics(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_quiz_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_session_questions (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id BIGINT(20) UNSIGNED NOT NULL,
  question_id INT(10) UNSIGNED NOT NULL,
  position TINYINT(3) UNSIGNED NOT NULL,
  user_answer_id INT(10) UNSIGNED NULL,
  is_correct TINYINT(1) NULL,
  answered_at DATETIME NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_quiz_session_questions_session_position (session_id, position),
  UNIQUE KEY uq_quiz_session_questions_session_question (session_id, question_id),
  KEY idx_quiz_session_questions_session_position (session_id, position),
  KEY idx_quiz_session_questions_question (question_id),
  CONSTRAINT fk_quiz_session_questions_session
    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_quiz_session_questions_question
    FOREIGN KEY (question_id) REFERENCES question_bank(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_quiz_session_questions_user_answer
    FOREIGN KEY (user_answer_id) REFERENCES question_bank_answers(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_question_history (
  id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT(10) UNSIGNED NULL,
  guest_token CHAR(36) NULL,
  question_id INT(10) UNSIGNED NOT NULL,
  topic_id INT(10) UNSIGNED NOT NULL,
  difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
  seen_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answered_correctly TINYINT(1) NULL,
  PRIMARY KEY (id),
  KEY idx_user_question_history_user_topic_difficulty (user_id, topic_id, difficulty, seen_at),
  KEY idx_user_question_history_guest_topic_difficulty (guest_token, topic_id, difficulty, seen_at),
  KEY idx_user_question_history_question (question_id),
  CONSTRAINT fk_user_question_history_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT fk_user_question_history_question
    FOREIGN KEY (question_id) REFERENCES question_bank(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT fk_user_question_history_topic
    FOREIGN KEY (topic_id) REFERENCES quiz_topics(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
