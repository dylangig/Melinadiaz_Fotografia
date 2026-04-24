-- ══════════════════════════════════════════════════════════════════════════════
-- SCHEMA D1 v3 — Melina Diaz Fotografía (Plantilla Completa)
-- ══════════════════════════════════════════════════════════════════════════════
-- Si ya tenés la base creada, usá el bloque MIGRACION al final del archivo.
-- Si la estás creando desde cero, ejecutá todo el archivo.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Categorías ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre  TEXT    NOT NULL,
  slug    TEXT    NOT NULL UNIQUE,
  portada TEXT    NOT NULL DEFAULT '',
  orden   INTEGER DEFAULT 0,
  activo  INTEGER DEFAULT 1
);

-- ── Trabajos ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trabajos (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria_slug     TEXT    NOT NULL REFERENCES categorias(slug),
  slug               TEXT    NOT NULL,
  nombre             TEXT    NOT NULL,
  año                TEXT    DEFAULT '2026',
  descripcion        TEXT,
  descripcion_evento TEXT,
  activo             INTEGER DEFAULT 1,
  orden              INTEGER DEFAULT 0,
  UNIQUE(categoria_slug, slug)
);

-- ── Fotos ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fotos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  trabajo_id INTEGER NOT NULL REFERENCES trabajos(id) ON DELETE CASCADE,
  nombre     TEXT    NOT NULL,
  orden      INTEGER DEFAULT 0
);

-- ── Servicios ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS servicios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre      TEXT    NOT NULL,
  descripcion TEXT,
  fotos_json  TEXT    DEFAULT '[]',
  orden       INTEGER DEFAULT 0,
  activo      INTEGER DEFAULT 1
);

-- ── Testimonios ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonios (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  texto  TEXT    NOT NULL,
  autora TEXT    NOT NULL,
  tipo   TEXT    NOT NULL,   -- "15 años", "Book infantil", etc.
  orden  INTEGER DEFAULT 0,
  activo INTEGER DEFAULT 1
);

-- ── Configuración global (una sola fila, id siempre = 1) ─────────────────────
CREATE TABLE IF NOT EXISTS configuracion (
  id INTEGER PRIMARY KEY DEFAULT 1,

  -- Identidad
  nombre_marca  TEXT DEFAULT 'Melina Diaz Fotografía',
  logo_url      TEXT DEFAULT '',
  tagline       TEXT DEFAULT 'Fotografía Profesional · Zona Sur Buenos Aires',

  -- Hero
  hero_url          TEXT DEFAULT '',
  hero_titulo       TEXT DEFAULT 'Capturando momentos que duran toda la vida',
  hero_subtitulo    TEXT DEFAULT 'Books infantiles, quinceañeras y bodas en Almirante Brown, Lomas de Zamora, Quilmes y toda la Zona Sur.',
  hero_boton_texto  TEXT DEFAULT 'Reservar sesión',

  -- Contacto
  whatsapp TEXT DEFAULT '5491176348089',
  email    TEXT DEFAULT '',
  zona     TEXT DEFAULT 'Zona Sur, Buenos Aires',

  -- Footer
  footer_texto TEXT DEFAULT 'Capturando momentos únicos con sensibilidad y pasión.',

  -- SEO
  seo_descripcion TEXT DEFAULT 'Fotografía profesional en Zona Sur Buenos Aires. Books infantiles, 15 años y bodas.',

  CHECK(id = 1)
);

-- ── Datos iniciales ───────────────────────────────────────────────────────────

INSERT OR IGNORE INTO categorias (nombre, slug, portada, orden) VALUES
  ('BOOK INFANTIL', 'infantil', 'portada-infantil.webp', 1),
  ('15 AÑOS',       'quince',   'portada-15.webp',       2),
  ('BODAS',         'bodas',    'portada-bodas.webp',    3);

INSERT OR IGNORE INTO servicios (nombre, descripcion, orden) VALUES
  ('Book Infantil',
   'Sesión de fotos profesional para bebés y niños de todas las edades. Capturamos su personalidad y los momentos más tiernos con una mirada sensible y divertida.',
   1),
  ('15 Años',
   'Capturamos ese momento mágico de los 15 con sesiones al aire libre o en estudio. Trabajamos juntas para que tu personalidad brille en cada foto.',
   2),
  ('Bodas',
   'Fotografiamos el día más especial de tu vida con discreción, emoción y un ojo para los detalles que hacen única cada boda en Zona Sur Buenos Aires.',
   3);

INSERT OR IGNORE INTO testimonios (texto, autora, tipo, orden) VALUES
  ('Fue la mejor decisión. Melina nos hizo sentir cómodos en todo momento y los resultados superaron todas nuestras expectativas.',
   'Sofía L.', '15 años', 1),
  ('Las fotos del book de mi nena son una obra de arte. Tiene una sensibilidad especial para capturar la personalidad de los chicos.',
   'Laura P.', 'Book infantil', 2);

INSERT OR IGNORE INTO configuracion (id) VALUES (1);


-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRACIÓN (ejecutar solo si ya tenés la base creada con el schema anterior)
-- Copiar y pegar cada línea por separado si alguna da error de "duplicate column"
-- ══════════════════════════════════════════════════════════════════════════════

-- Agregar columnas nuevas a configuracion (ignorar error si ya existen):
ALTER TABLE configuracion ADD COLUMN tagline          TEXT DEFAULT 'Fotografía Profesional · Zona Sur Buenos Aires';
ALTER TABLE configuracion ADD COLUMN hero_titulo      TEXT DEFAULT 'Capturando momentos que duran toda la vida';
ALTER TABLE configuracion ADD COLUMN hero_subtitulo   TEXT DEFAULT 'Books infantiles, quinceañeras y bodas en Almirante Brown, Lomas de Zamora, Quilmes y toda la Zona Sur.';
ALTER TABLE configuracion ADD COLUMN hero_boton_texto TEXT DEFAULT 'Reservar sesión';
ALTER TABLE configuracion ADD COLUMN email            TEXT DEFAULT '';
ALTER TABLE configuracion ADD COLUMN zona             TEXT DEFAULT 'Zona Sur, Buenos Aires';
ALTER TABLE configuracion ADD COLUMN footer_texto     TEXT DEFAULT 'Capturando momentos únicos con sensibilidad y pasión.';
ALTER TABLE configuracion ADD COLUMN seo_descripcion  TEXT DEFAULT 'Fotografía profesional en Zona Sur Buenos Aires.';

-- Agregar columna activo a categorias y servicios:
ALTER TABLE categorias ADD COLUMN activo INTEGER DEFAULT 1;
ALTER TABLE servicios  ADD COLUMN activo INTEGER DEFAULT 1;

-- Crear tabla testimonios si no existe:
CREATE TABLE IF NOT EXISTS testimonios (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  texto  TEXT    NOT NULL,
  autora TEXT    NOT NULL,
  tipo   TEXT    NOT NULL,
  orden  INTEGER DEFAULT 0,
  activo INTEGER DEFAULT 1
);

-- Cargar testimonios iniciales si la tabla estaba vacía:
INSERT OR IGNORE INTO testimonios (texto, autora, tipo, orden) VALUES
  ('Fue la mejor decisión. Melina nos hizo sentir cómodos en todo momento y los resultados superaron todas nuestras expectativas.',
   'Sofía L.', '15 años', 1),
  ('Las fotos del book de mi nena son una obra de arte. Tiene una sensibilidad especial para capturar la personalidad de los chicos.',
   'Laura P.', 'Book infantil', 2);
