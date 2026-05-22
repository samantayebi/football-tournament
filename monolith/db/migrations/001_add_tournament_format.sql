ALTER TABLE tournament ADD COLUMN IF NOT EXISTS format VARCHAR(50) DEFAULT 'single-elimination';
