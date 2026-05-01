CREATE TABLE IF NOT EXISTS sobre_mi (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  titulo TEXT,
  texto TEXT,
  foto_url TEXT,
  cta_texto TEXT,
  cta_destino TEXT
);
