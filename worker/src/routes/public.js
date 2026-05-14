// ── routes/public.js ─────────────────────────────────────────────────────────

import { booleanFromDb, json, error } from '../helpers.js';

// GET /api/categorias
export async function getCategorias(env) {
  const { results } = await env.DB.prepare(
    'SELECT slug, nombre, portada, orden, mostrar_en_home FROM categorias WHERE activo = 1 ORDER BY orden ASC'
  ).all();
  return json(results.map(cat => ({
    nombre:        cat.nombre,
    slug:          cat.slug,
    portada:       cat.portada,
    orden:         cat.orden,
    mostrarEnHome: booleanFromDb(cat.mostrar_en_home),
  })));
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

  if (trabajos.length === 0) return json([]);

  const ids = trabajos.map(t => t.id);
  const placeholders = ids.map(() => '?').join(', ');
  const { results: fotos } = await env.DB.prepare(
    `SELECT trabajo_id, nombre FROM fotos WHERE trabajo_id IN (${placeholders}) ORDER BY trabajo_id ASC, orden ASC, id ASC`
  ).bind(...ids).all();
  const fotosPorTrabajo = {};
  for (const foto of fotos) {
    if (!fotosPorTrabajo[foto.trabajo_id]) fotosPorTrabajo[foto.trabajo_id] = [];
    fotosPorTrabajo[foto.trabajo_id].push(foto.nombre);
  }

  const trabajosConFotos = trabajos.map(t => ({
    slug:               t.slug,
    nombre:             t.nombre,
    año:                t.año,
    descripcion:        t.descripcion        ?? null,
    descripcion_evento: t.descripcion_evento ?? null,
    fotos:              fotosPorTrabajo[t.id] ?? [],
  }));

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
  })), 200, {}, 120);
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
export async function getConfiguracion(request, env) {
  try {
    const row = await env.DB.prepare(
      `SELECT * FROM configuracion WHERE id = 1`
    ).first();

    return json(row || {});
  } catch (e) {
    console.error('Error en /api/configuracion:', e);
    return error('Error obteniendo configuración', 500);
  }
}

// GET /api/sobre-mi
export async function getSobreMi(env) {
  try {
    const row = await env.DB.prepare(
      'SELECT titulo, texto, foto_url, cta_texto, cta_destino FROM sobre_mi WHERE id = 1'
    ).first();

    if (!row) return json({});

    return json({
      titulo:      row.titulo      ?? '',
      texto:       row.texto       ?? '',
      foto_url:    row.foto_url    ?? '',
      cta_texto:   row.cta_texto   ?? '',
      cta_destino: row.cta_destino ?? '',
      fotoUrl:     row.foto_url    ?? '',
      ctaTexto:    row.cta_texto   ?? '',
      ctaDestino:  row.cta_destino ?? '',
    });
  } catch (e) {
    console.error('Error en /api/sobre-mi:', e);
    return error('Error obteniendo sobre mi', 500);
  }
}

export async function getSitemap(env) {
  const BASE = 'https://melinadiazfotografia.com.ar';

  const staticUrls = [
    { loc: '/',           priority: '1.0', changefreq: 'weekly'  },
    { loc: '/servicios',  priority: '0.8', changefreq: 'monthly' },
    { loc: '/sobre-mi',   priority: '0.7', changefreq: 'monthly' },
    { loc: '/contacto',   priority: '0.9', changefreq: 'monthly' },
  ];

  const { results: categorias } = await env.DB.prepare(
    'SELECT slug FROM categorias WHERE activo = 1 ORDER BY orden ASC'
  ).all();

  const { results: trabajos } = await env.DB.prepare(
    'SELECT slug, categoria_slug FROM trabajos WHERE activo = 1 ORDER BY id ASC'
  ).all();

  const catUrls = categorias.map(c => ({
    loc: `/galeria/${c.slug}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  const trabajoUrls = trabajos.map(t => ({
    loc: `/galeria/${t.categoria_slug}/${t.slug}`,
    priority: '0.7',
    changefreq: 'monthly',
  }));

  const allUrls = [...staticUrls, ...catUrls, ...trabajoUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${BASE}${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
