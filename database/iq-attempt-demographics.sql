ALTER TABLE iq_attempts
  ADD COLUMN birth_date DATE NULL AFTER user_id,
  ADD COLUMN gender VARCHAR(30) NULL AFTER birth_date;
