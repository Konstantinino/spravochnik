-- Support party: add «Дополнительно» category for tech support topics
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_party_check;
ALTER TABLE topics ADD CONSTRAINT topics_party_check
  CHECK (party IS NULL OR party IN ('supplier', 'customer', 'errors', 'additional'));
