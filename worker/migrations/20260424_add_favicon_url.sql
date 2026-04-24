-- Add independent favicon URL to global config.
ALTER TABLE configuracion ADD COLUMN favicon_url TEXT DEFAULT '';
