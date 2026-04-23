// ── routes/public.js ─────────────────────────────────────────────────────────
// Endpoints públicos (sin autenticación)

import { json, error } from '../helpers.js';

// GET /api/categorias
export async function getCategorias(env) {
  const { results } = await env.DB.prepare(
    'SELECT nombre, slug, portada FROM categorias ORDER BY orden ASC'
  ).all();
  return json(results);
}

// GET /api/trabajos/:categoriaSlug
export async function getTrabajos(env, categoriaSlug) {
  // Verificar que la categoría existe
  const cat = await env.DB.prepare(
    'SELECT slug FROM categorias WHERE slug = ?'
  ).bind(categoriaSlug).first();
  if (!cat) return error('Categoría no encontrada', 404);

  // Traer trabajos activos con sus fotos
  const { results: trabajos } = await env.DB.prepare(
    `SELECT id, slug, nombre, año, descripcion, descripcion_evento
     FROM trabajos
     WHERE categoria_slug = ? AND activo = 1
     ORDER BY orden ASC, id ASC`
  ).bind(categoriaSlug).all();

  // Para cada trabajo, traer sus fotos ordenadas
  const trabajosConFotos = await Promise.all(
    trabajos.map(async (t) => {
      const { results: fotos } = await env.DB.prepare(
        'SELECT nombre FROM fotos WHERE trabajo_id = ? ORDER BY orden ASC, id ASC'
      ).bind(t.id).all();
      return {
        slug:               t.slug,
        nombre:             t.nombre,
        año:                t.año,
        descripcion:        t.descripcion  ?? null,
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
    descripcion:        trabajo.descripcion ?? null,
    descripcion_evento: trabajo.descripcion_evento ?? null,
    fotos:              fotos.map(f => f.nombre),
  });
}

// GET /api/servicios
export async function getServicios(env) {
  const { results } = await env.DB.prepare(
    'SELECT nombre, descripcion, fotos_json FROM servicios ORDER BY orden ASC'
  ).all();

  return json(results.map(s => ({
    nombre:      s.nombre,
    descripcion: s.descripcion,
    fotos:       JSON.parse(s.fotos_json ?? '[]'),
  })));
}
