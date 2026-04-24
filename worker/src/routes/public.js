// ── routes/public.js ─────────────────────────────────────────────────────────

import { json, error } from '../helpers.js';

// GET /api/categorias
export async function getCategorias(env) {
  const { results } = await env.DB.prepare(
    'SELECT nombre, slug, portada FROM categorias WHERE activo = 1 ORDER BY orden ASC'
  ).all();
  return json(results);
}

// GET /api/trabajos/:categoriaSlug
export async function getTrabajos(env, categoriaSlug) {
  const cat = await env.DB.prepare(
    'SELECT slug FROM categorias WHERE slug = ? AND activo = 1'
  ).bind(categoriaSlug).first();
  if (!cat) return error('Categoría no encontrada', 404);

  const { results: trabajos } = await env.DB.prepare(
    `SELECT id, slug, nombre, año, descripcion, descripcion_evento
     FROM trabajos
     WHERE categoria_slug = ? AND activo = 1
     ORDER BY orden ASC, id ASC`
  ).bind(categoriaSlug).all();

  const trabajosConFotos = await Promise.all(
    trabajos.map(async (t) => {
      const { results: fotos } = await env.DB.prepare(
        'SELECT nombre FROM fotos WHERE trabajo_id = ? ORDER BY orden ASC, id ASC'
      ).bind(t.id).all();
      return {
        slug:               t.slug,
        nombre:             t.nombre,
        año:                t.año,
        descripcion:        t.descripcion        ?? null,
        descripcion_evento: t.descripcion_evento ?? null,
        fotos:              fotos.map(f => f.nombre),
      };
    })
  );

  return json(trabajosConFotos);
}

// GET /api/trabajos/:categoriaSlug/:trabajoSlug
export async function getTrabajoDetalle(env, categoriaSlug, trabajoSlug) {
  const trabajo = await env.DB.prepare(
    `SELECT id, slug, nombre, año, descripcion, descripcion_evento
     FROM trabajos
     WHERE categoria_slug = ? AND slug = ? AND activo = 1`
  ).bind(categoriaSlug, trabajoSlug).first();

  if (!trabajo) return error('Trabajo no encontrado', 404);

  const { results: fotos } = await env.DB.prepare(
    'SELECT nombre FROM fotos WHERE trabajo_id = ? ORDER BY orden ASC, id ASC'
  ).bind(trabajo.id).all();

  return json({
    slug:               trabajo.slug,
    nombre:             trabajo.nombre,
    año:                trabajo.año,
    descripcion:        trabajo.descripcion        ?? null,
    descripcion_evento: trabajo.descripcion_evento ?? null,
    fotos:              fotos.map(f => f.nombre),
  });
}

// GET /api/servicios
export async function getServicios(env) {
  const { results } = await env.DB.prepare(
    'SELECT nombre, descripcion, fotos_json FROM servicios WHERE activo = 1 ORDER BY orden ASC'
  ).all();

  return json(results.map(s => ({
    nombre:      s.nombre,
    descripcion: s.descripcion,
    fotos:       JSON.parse(s.fotos_json ?? '[]'),
  })));
}

// GET /api/testimonios
export async function getTestimonios(env) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT texto, autora, tipo FROM testimonios WHERE activo = 1 ORDER BY orden ASC'
    ).all();
    return json(results);
  } catch {
    return json([]);
  }
}

// GET /api/configuracion
export async function getConfiguracion(env) {
  try {
    const row = await env.DB.prepare(
      `SELECT nombre_marca, logo_url, tagline,
              hero_url, hero_titulo, hero_subtitulo, hero_boton_texto,
              whatsapp, email, zona, footer_texto, seo_descripcion
       FROM configuracion WHERE id = 1`
    ).first();
    return json(row ?? {
      nombre_marca:     'Melina Diaz Fotografía',
      logo_url:         '',
      tagline:          'Fotografía Profesional · Zona Sur Buenos Aires',
      hero_url:         '',
      hero_titulo:      'Capturando momentos que duran toda la vida',
      hero_subtitulo:   'Books infantiles, quinceañeras y bodas en Almirante Brown, Lomas de Zamora, Quilmes y toda la Zona Sur.',
      hero_boton_texto: 'Reservar sesión',
      whatsapp:         '5491176348089',
      email:            '',
      zona:             'Zona Sur, Buenos Aires',
      footer_texto:     'Capturando momentos únicos con sensibilidad y pasión.',
      seo_descripcion:  'Fotografía profesional en Zona Sur Buenos Aires.',
    });
  } catch {
    return json({ nombre_marca: 'Melina Diaz Fotografía', logo_url: '', hero_url: '' });
  }
}
