ALTER TABLE users
  ADD COLUMN birth_date DATE NULL AFTER avatar_url,
  ADD COLUMN gender VARCHAR(30) NULL AFTER birth_date,
  ADD COLUMN newsletter_opt_in TINYINT(1) NOT NULL DEFAULT 0 AFTER gender,
  ADD COLUMN notifications_opt_in TINYINT(1) NOT NULL DEFAULT 0 AFTER newsletter_opt_in,
  ADD COLUMN password_setup_required TINYINT(1) NOT NULL DEFAULT 0 AFTER notifications_opt_in;
