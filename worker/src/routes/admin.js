// ── routes/admin.js v3 ───────────────────────────────────────────────────────

import { json, error, slugify, subirImagenAR2 } from '../helpers.js';
import { generarToken, verificarToken, tokenDesdeRequest } from '../auth.js';

async function requireAdmin(request, env) {
  const token = tokenDesdeRequest(request);
  if (!token) return false;
  return verificarToken(token, env.JWT_SECRET);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function adminLogin(request, env) {
  const body = await request.json().catch(() => ({}));
  if (body.password !== env.ADMIN_PASSWORD) return error('Contraseña incorrecta', 401);
  const token = await generarToken(env.JWT_SECRET);
  return json({ ok: true, token });
}

export async function adminCheck(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);
  return json({ ok: true });
}

// ── Trabajos ──────────────────────────────────────────────────────────────────

export async function getTodosTrabaj(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const { results: cats } = await env.DB.prepare(
    'SELECT slug FROM categorias ORDER BY orden ASC'
  ).all();

  const resultado = {};
  for (const cat of cats) {
    const { results: trabajos } = await env.DB.prepare(
      `SELECT id, slug, nombre, año, descripcion, descripcion_evento
       FROM trabajos WHERE categoria_slug = ? ORDER BY orden ASC, id ASC`
    ).bind(cat.slug).all();

    resultado[cat.slug] = await Promise.all(trabajos.map(async (t) => {
      const { results: fotos } = await env.DB.prepare(
        'SELECT nombre FROM fotos WHERE trabajo_id = ? ORDER BY orden ASC, id ASC'
      ).bind(t.id).all();
      return { ...t, fotos: fotos.map(f => f.nombre) };
    }));
  }
  return json(resultado);
}

export async function nuevoTrabajo(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form              = await request.formData();
  const categoria         = form.get('categoria');
  const nombre            = form.get('nombre')?.trim();
  if (!categoria || !nombre) return error('Faltan campos obligatorios');

  const slug              = slugify(nombre);
  const descripcion       = form.get('descripcion')?.trim()        || null;
  const descripcionEvento = form.get('descripcion_evento')?.trim() || null;

  const { meta } = await env.DB.prepare(
    `INSERT OR IGNORE INTO trabajos (categoria_slug, slug, nombre, descripcion, descripcion_evento)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(categoria, slug, nombre, descripcion, descripcionEvento).run();

  const trabajoId = meta.last_row_id;
  if (!trabajoId) return error('El trabajo ya existe o hubo un error', 409);

  let guardadas = 0;
  const fotos = form.getAll('fotos');
  for (const [idx, foto] of fotos.entries()) {
    if (!foto || !foto.name) continue;
    const ext      = foto.name.split('.').pop()?.toLowerCase() || 'webp';
    const nombreR2 = `${idx + 1}.${ext}`;
    const key      = `${categoria}/${slug}/${nombreR2}`;
    await subirImagenAR2(env.BUCKET, key, await foto.arrayBuffer(), foto.type);
    await env.DB.prepare(
      'INSERT INTO fotos (trabajo_id, nombre, orden) VALUES (?, ?, ?)'
    ).bind(trabajoId, nombreR2, idx + 1).run();
    guardadas++;
  }

  return json({ mensaje: `Trabajo '${slug}' creado con ${guardadas} fotos.` });
}

export async function agregarFotos(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form        = await request.formData();
  const categoria   = form.get('categoria');
  const trabajoSlug = form.get('trabajo');

  const trabajo = await env.DB.prepare(
    'SELECT id FROM trabajos WHERE categoria_slug = ? AND slug = ?'
  ).bind(categoria, trabajoSlug).first();
  if (!trabajo) return error('Trabajo no encontrado', 404);

  const maxOrden  = await env.DB.prepare(
    'SELECT COALESCE(MAX(orden), 0) as m FROM fotos WHERE trabajo_id = ?'
  ).bind(trabajo.id).first();
  const ordenBase = maxOrden?.m ?? 0;

  let guardadas = 0;
  for (const [idx, foto] of form.getAll('fotos').entries()) {
    if (!foto || !foto.name) continue;
    const ext      = foto.name.split('.').pop()?.toLowerCase() || 'webp';
    const orden    = ordenBase + idx + 1;
    const nombreR2 = `${orden}.${ext}`;
    const key      = `${categoria}/${trabajoSlug}/${nombreR2}`;
    await subirImagenAR2(env.BUCKET, key, await foto.arrayBuffer(), foto.type);
    await env.DB.prepare(
      'INSERT INTO fotos (trabajo_id, nombre, orden) VALUES (?, ?, ?)'
    ).bind(trabajo.id, nombreR2, orden).run();
    guardadas++;
  }

  return json({ mensaje: `${guardadas} fotos agregadas a '${trabajoSlug}'.` });
}

export async function editarTrabajo(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form              = await request.formData();
  const categoria         = form.get('categoria');
  const trabajoSlug       = form.get('trabajo');
  const descripcion       = form.get('descripcion')?.trim()        || null;
  const descripcionEvento = form.get('descripcion_evento')?.trim() || null;

  await env.DB.prepare(
    `UPDATE trabajos SET descripcion = ?, descripcion_evento = ?
     WHERE categoria_slug = ? AND slug = ?`
  ).bind(descripcion, descripcionEvento, categoria, trabajoSlug).run();

  return json({ mensaje: `Trabajo '${trabajoSlug}' actualizado.` });
}

export async function eliminarTrabajo(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form        = await request.formData();
  const categoria   = form.get('categoria');
  const trabajoSlug = form.get('trabajo');

  const trabajo = await env.DB.prepare(
    'SELECT id FROM trabajos WHERE categoria_slug = ? AND slug = ?'
  ).bind(categoria, trabajoSlug).first();
  if (!trabajo) return error('Trabajo no encontrado', 404);

  const { results: fotos } = await env.DB.prepare(
    'SELECT nombre FROM fotos WHERE trabajo_id = ?'
  ).bind(trabajo.id).all();

  await Promise.all(fotos.map(f => env.BUCKET.delete(`${categoria}/${trabajoSlug}/${f.nombre}`)));
  await env.DB.prepare('DELETE FROM trabajos WHERE id = ?').bind(trabajo.id).run();

  return json({ mensaje: `Trabajo '${trabajoSlug}' eliminado.` });
}

export async function eliminarFoto(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form        = await request.formData();
  const categoria   = form.get('categoria');
  const trabajoSlug = form.get('trabajo');
  const fotoNombre  = form.get('foto');

  const trabajo = await env.DB.prepare(
    'SELECT id FROM trabajos WHERE categoria_slug = ? AND slug = ?'
  ).bind(categoria, trabajoSlug).first();
  if (!trabajo) return error('Trabajo no encontrado', 404);

  await env.BUCKET.delete(`${categoria}/${trabajoSlug}/${fotoNombre}`);
  await env.DB.prepare(
    'DELETE FROM fotos WHERE trabajo_id = ? AND nombre = ?'
  ).bind(trabajo.id, fotoNombre).run();

  return json({ mensaje: `Foto '${fotoNombre}' eliminada.` });
}

export async function reordenarFotos(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const { categoria, trabajo: trabajoSlug, orden } = await request.json();

  const trabajo = await env.DB.prepare(
    'SELECT id FROM trabajos WHERE categoria_slug = ? AND slug = ?'
  ).bind(categoria, trabajoSlug).first();
  if (!trabajo) return error('Trabajo no encontrado', 404);

  await Promise.all(
    orden.map((nombreFoto, idx) =>
      env.DB.prepare('UPDATE fotos SET orden = ? WHERE trabajo_id = ? AND nombre = ?')
        .bind(idx + 1, trabajo.id, nombreFoto).run()
    )
  );

  return json({ mensaje: 'Fotos reordenadas correctamente.' });
}

// ── Configuración ─────────────────────────────────────────────────────────────

export async function actualizarConfiguracion(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const body = await request.json().catch(() => ({}));

  const CAMPOS_PERMITIDOS = [
    'nombre_marca', 'tagline', 'seo_descripcion',
    'hero_url', 'hero_titulo', 'hero_subtitulo', 'hero_boton_texto',
    'whatsapp', 'email', 'zona', 'footer_texto',
  ];

  const sets   = [];
  const vals   = [];
  for (const campo of CAMPOS_PERMITIDOS) {
    if (body[campo] !== undefined) { sets.push(`${campo} = ?`); vals.push(body[campo]); }
  }
  if (sets.length === 0) return error('No se enviaron campos para actualizar');

  await env.DB.prepare(
    `INSERT INTO configuracion (id) VALUES (1)
     ON CONFLICT(id) DO UPDATE SET ${sets.join(', ')}`
  ).bind(...vals).run();

  return json({ mensaje: 'Configuración actualizada.' });
}

export async function subirLogo(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form = await request.formData();
  const file = form.get('file');
  if (!file?.name) return error('No se recibió ningún archivo');

  const ext    = file.name.split('.').pop()?.toLowerCase() || 'webp';
  const key    = `assets/logo.${ext}`;
  await subirImagenAR2(env.BUCKET, key, await file.arrayBuffer(), file.type);
  const logoUrl = `${env.R2_PUBLIC_URL}/${key}`;

  await env.DB.prepare(
    `INSERT INTO configuracion (id, logo_url) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET logo_url = excluded.logo_url`
  ).bind(logoUrl).run();

  return json({ url: logoUrl, mensaje: 'Logo actualizado.' });
}

export async function subirHero(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form = await request.formData();
  const file = form.get('file');
  if (!file?.name) return error('No se recibió ningún archivo');

  const ext     = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const key     = `assets/hero.${ext}`;
  await subirImagenAR2(env.BUCKET, key, await file.arrayBuffer(), file.type);
  const heroUrl = `${env.R2_PUBLIC_URL}/${key}`;

  await env.DB.prepare(
    `INSERT INTO configuracion (id, hero_url) VALUES (1, ?)
     ON CONFLICT(id) DO UPDATE SET hero_url = excluded.hero_url`
  ).bind(heroUrl).run();

  return json({ url: heroUrl, mensaje: 'Imagen de hero actualizada.' });
}

export async function subirPortada(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form = await request.formData();
  const file = form.get('file');
  const slug = form.get('slug');

  if (!file?.name) return error('No se recibió ningún archivo');
  if (!slug)       return error('Falta el slug de la categoría');

  const cat = await env.DB.prepare('SELECT slug FROM categorias WHERE slug = ?').bind(slug).first();
  if (!cat) return error('Categoría no encontrada', 404);

  const ext      = file.name.split('.').pop()?.toLowerCase() || 'webp';
  const nombreR2 = `portada-${slug}.${ext}`;
  await subirImagenAR2(env.BUCKET, nombreR2, await file.arrayBuffer(), file.type);

  await env.DB.prepare('UPDATE categorias SET portada = ? WHERE slug = ?').bind(nombreR2, slug).run();

  return json({ url: `${env.R2_PUBLIC_URL}/${nombreR2}`, mensaje: `Portada de ${slug} actualizada.` });
}

// ── Testimonios ───────────────────────────────────────────────────────────────

// GET /api/admin/testimonios  (autenticado — para el panel)
export async function getTestimoniosAdmin(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);
  const { results } = await env.DB.prepare(
    'SELECT id, texto, autora, tipo, orden FROM testimonios WHERE activo = 1 ORDER BY orden ASC'
  ).all();
  return json(results);
}

// POST /api/admin/testimonios/nuevo
export async function nuevoTestimonio(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const { texto, autora, tipo, orden = 0 } = await request.json().catch(() => ({}));
  if (!texto || !autora || !tipo) return error('Faltan campos obligatorios');

  await env.DB.prepare(
    'INSERT INTO testimonios (texto, autora, tipo, orden) VALUES (?, ?, ?, ?)'
  ).bind(texto.trim(), autora.trim(), tipo.trim(), orden).run();

  return json({ mensaje: 'Testimonio agregado.' });
}

// POST /api/admin/testimonios/editar
export async function editarTestimonio(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const { id, texto, autora, tipo, orden } = await request.json().catch(() => ({}));
  if (!id) return error('Falta el id del testimonio');

  await env.DB.prepare(
    'UPDATE testimonios SET texto = ?, autora = ?, tipo = ?, orden = ? WHERE id = ?'
  ).bind(texto?.trim(), autora?.trim(), tipo?.trim(), orden ?? 0, id).run();

  return json({ mensaje: 'Testimonio actualizado.' });
}

// POST /api/admin/testimonios/eliminar
export async function eliminarTestimonio(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const { id } = await request.json().catch(() => ({}));
  if (!id) return error('Falta el id');

  await env.DB.prepare('UPDATE testimonios SET activo = 0 WHERE id = ?').bind(id).run();
  return json({ mensaje: 'Testimonio eliminado.' });
}

// ── Categorías ────────────────────────────────────────────────────────────────

// POST /api/admin/categorias/nueva
export async function nuevaCategoria(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const { nombre, slug } = await request.json().catch(() => ({}));
  if (!nombre || !slug) return error('Faltan nombre y slug');

  const slugLimpio = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

  // Orden = máximo actual + 1
  const maxOrden = await env.DB.prepare(
    'SELECT COALESCE(MAX(orden), 0) as m FROM categorias'
  ).first();

  await env.DB.prepare(
    `INSERT OR IGNORE INTO categorias (nombre, slug, portada, orden)
     VALUES (?, ?, ?, ?)`
  ).bind(nombre.trim().toUpperCase(), slugLimpio, `portada-${slugLimpio}.webp`, (maxOrden?.m ?? 0) + 1).run();

  return json({ mensaje: `Categoría '${slugLimpio}' creada. Recordá subir la portada desde la sección Categorías.` });
}

// POST /api/admin/categorias/renombrar
export async function renombrarCategoria(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const { slug, nombre } = await request.json().catch(() => ({}));
  if (!slug || !nombre) return error('Faltan slug y nombre');

  await env.DB.prepare('UPDATE categorias SET nombre = ? WHERE slug = ?')
    .bind(nombre.trim().toUpperCase(), slug).run();

  return json({ mensaje: `Categoría renombrada a '${nombre}'.` });
}

// POST /api/admin/categorias/eliminar
export async function eliminarCategoria(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const { slug } = await request.json().catch(() => ({}));
  if (!slug) return error('Falta el slug');

  // Obtener todos los trabajos de esta categoría
  const { results: trabajos } = await env.DB.prepare(
    'SELECT id, slug FROM trabajos WHERE categoria_slug = ?'
  ).bind(slug).all();

  // Eliminar fotos de R2 y registros de D1 para cada trabajo
  for (const t of trabajos) {
    const { results: fotos } = await env.DB.prepare(
      'SELECT nombre FROM fotos WHERE trabajo_id = ?'
    ).bind(t.id).all();
    await Promise.all(fotos.map(f => env.BUCKET.delete(`${slug}/${t.slug}/${f.nombre}`)));
    await env.DB.prepare('DELETE FROM trabajos WHERE id = ?').bind(t.id).run();
  }

  // Eliminar portada de R2
  const cat = await env.DB.prepare('SELECT portada FROM categorias WHERE slug = ?').bind(slug).first();
  if (cat?.portada) await env.BUCKET.delete(cat.portada).catch(() => {});

  // Eliminar categoría de D1
  await env.DB.prepare('DELETE FROM categorias WHERE slug = ?').bind(slug).run();

  return json({ mensaje: `Categoría '${slug}' y todas sus sesiones eliminadas.` });
}
