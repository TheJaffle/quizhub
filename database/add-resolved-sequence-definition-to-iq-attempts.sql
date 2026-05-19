ALTER TABLE iq_attempts
  ADD COLUMN resolved_sequence_definition LONGTEXT NULL
  AFTER attempt_token;
