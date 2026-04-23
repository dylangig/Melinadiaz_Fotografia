-- ══════════════════════════════════════════════════════════════
-- SCHEMA D1 — Melina Diaz Fotografía
-- Ejecutar con: wrangler d1 execute melina-db --file=schema.sql
-- ══════════════════════════════════════════════════════════════

-- Categorías (infantil, quince, bodas)
CREATE TABLE IF NOT EXISTS categorias (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre  TEXT NOT NULL,          -- "BOOK INFANTIL"
  slug    TEXT NOT NULL UNIQUE,   -- "infantil"
  portada TEXT NOT NULL,          -- "portada-infantil.webp"
  orden   INTEGER DEFAULT 0
);

-- Trabajos (sesiones fotográficas)
CREATE TABLE IF NOT EXISTS trabajos (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria_slug      TEXT NOT NULL REFERENCES categorias(slug),
  slug                TEXT NOT NULL,   -- "jose"
  nombre              TEXT NOT NULL,   -- "José"
  año                 TEXT DEFAULT '2026',
  descripcion         TEXT,
  descripcion_evento  TEXT,
  activo              INTEGER DEFAULT 1,
  orden               INTEGER DEFAULT 0,
  UNIQUE(categoria_slug, slug)
);

-- Fotos de cada trabajo
CREATE TABLE IF NOT EXISTS fotos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  trabajo_id INTEGER NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,    -- "1.webp"
  orden      INTEGER DEFAULT 0
);

-- Servicios
CREATE TABLE IF NOT EXISTS servicios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT NOT NULL,
  descripcion TEXT,
  fotos_json  TEXT DEFAULT '[]',   -- JSON array de nombres de imagen
  orden       INTEGER DEFAULT 0
);

-- ── Datos iniciales ───────────────────────────────────────────────────────

INSERT OR IGNORE INTO categorias (nombre, slug, portada, orden) VALUES
  ('BOOK INFANTIL', 'infantil', 'portada-infantil.webp', 1),
  ('15 AÑOS',       'quince',   'portada-15.webp',       2),
  ('BODAS',         'bodas',    'portada-bodas.webp',    3);

INSERT OR IGNORE INTO servicios (nombre, descripcion, fotos_json, orden) VALUES
  ('Book Infantil',
   'Sesión de fotos profesional para bebés y niños de todas las edades. Capturamos su personalidad y los momentos más tiernos con una mirada sensible y divertida.',
   '[]', 1),
  ('15 Años',
   'Capturamos ese momento mágico de los 15 con sesiones al aire libre o en estudio. Trabajamos juntas para que tu personalidad brille en cada foto.',
   '[]', 2),
  ('Bodas',
   'Fotografiamos el día más especial de tu vida con discreción, emoción y un ojo para los detalles que hacen única cada boda en Zona Sur Buenos Aires.',
   '[]', 3);
