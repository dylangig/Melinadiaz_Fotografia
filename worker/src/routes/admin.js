// ── routes/admin.js ──────────────────────────────────────────────────────────

import { json, error, slugify, subirImagenAR2 } from '../helpers.js';
import { generarToken, verificarToken, tokenDesdeRequest } from '../auth.js';

async function requireAdmin(request, env) {
  const token = tokenDesdeRequest(request);
  if (!token) return false;
  return verificarToken(token, env.JWT_SECRET);
}

// POST /api/admin/login
export async function adminLogin(request, env) {
  const body = await request.json().catch(() => ({}));
  if (body.password !== env.ADMIN_PASSWORD) return error('Contraseña incorrecta', 401);
  const token = await generarToken(env.JWT_SECRET);
  return json({ ok: true, token });
}

// GET /api/admin/check
export async function adminCheck(request, env) {
  const ok = await requireAdmin(request, env);
  if (!ok) return error('No autorizado', 401);
  return json({ ok: true });
}

// GET /api/admin/trabajos-todos
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

// POST /api/admin/nuevo-trabajo
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
    const buffer   = await foto.arrayBuffer();
    await subirImagenAR2(env.BUCKET, key, buffer, foto.type);
    await env.DB.prepare(
      'INSERT INTO fotos (trabajo_id, nombre, orden) VALUES (?, ?, ?)'
    ).bind(trabajoId, nombreR2, idx + 1).run();
    guardadas++;
  }

  return json({ mensaje: `Trabajo '${slug}' creado con ${guardadas} fotos.` });
}

// POST /api/admin/agregar-fotos
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
  const fotos = form.getAll('fotos');
  for (const [idx, foto] of fotos.entries()) {
    if (!foto || !foto.name) continue;
    const ext      = foto.name.split('.').pop()?.toLowerCase() || 'webp';
    const orden    = ordenBase + idx + 1;
    const nombreR2 = `${orden}.${ext}`;
    const key      = `${categoria}/${trabajoSlug}/${nombreR2}`;
    const buffer   = await foto.arrayBuffer();
    await subirImagenAR2(env.BUCKET, key, buffer, foto.type);
    await env.DB.prepare(
      'INSERT INTO fotos (trabajo_id, nombre, orden) VALUES (?, ?, ?)'
    ).bind(trabajo.id, nombreR2, orden).run();
    guardadas++;
  }

  return json({ mensaje: `${guardadas} fotos agregadas a '${trabajoSlug}'.` });
}

// POST /api/admin/editar-trabajo
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

// POST /api/admin/eliminar-trabajo
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

  await Promise.all(
    fotos.map(f => env.BUCKET.delete(`${categoria}/${trabajoSlug}/${f.nombre}`))
  );

  await env.DB.prepare('DELETE FROM trabajos WHERE id = ?').bind(trabajo.id).run();

  return json({ mensaje: `Trabajo '${trabajoSlug}' eliminado.` });
}

// POST /api/admin/eliminar-foto
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

// POST /api/admin/reordenar-fotos
export async function reordenarFotos(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const { categoria, trabajo: trabajoSlug, orden } = await request.json();

  const trabajo = await env.DB.prepare(
    'SELECT id FROM trabajos WHERE categoria_slug = ? AND slug = ?'
  ).bind(categoria, trabajoSlug).first();
  if (!trabajo) return error('Trabajo no encontrado', 404);

  await Promise.all(
    orden.map((nombreFoto, idx) =>
      env.DB.prepare(
        'UPDATE fotos SET orden = ? WHERE trabajo_id = ? AND nombre = ?'
      ).bind(idx + 1, trabajo.id, nombreFoto).run()
    )
  );

  return json({ mensaje: 'Fotos reordenadas correctamente.' });
}

// ── CONFIGURACIÓN GLOBAL ──────────────────────────────────────────────────────

// GET /api/configuracion  (pública — usada por Navbar e Inicio)
export async function getConfiguracion(env) {
  try {
    const row = await env.DB.prepare(
      'SELECT nombre_marca, logo_url, hero_url FROM configuracion WHERE id = 1'
    ).first();
    return json(row ?? { nombre_marca: 'Melina Diaz Fotografía', logo_url: '', hero_url: '' });
  } catch {
    return json({ nombre_marca: 'Melina Diaz Fotografía', logo_url: '', hero_url: '' });
  }
}

// POST /api/admin/configuracion
// Body JSON: { nombre_marca?, hero_url? }
// Acepta actualizar nombre_marca y/o vaciar hero_url
export async function actualizarConfiguracion(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const body = await request.json().catch(() => ({}));

  // Construir SET dinámico solo con los campos que vienen
  const campos = [];
  const valores = [];

  if (body.nombre_marca !== undefined) {
    campos.push('nombre_marca = ?');
    valores.push(body.nombre_marca.trim());
  }
  if (body.hero_url !== undefined) {
    campos.push('hero_url = ?');
    valores.push(body.hero_url);
  }

  if (campos.length === 0) return error('No se enviaron campos para actualizar');

  // Upsert
  await env.DB.prepare(`
    INSERT INTO configuracion (id, ${campos.map(c => c.split(' ')[0]).join(', ')})
    VALUES (1, ${campos.map(() => '?').join(', ')})
    ON CONFLICT(id) DO UPDATE SET ${campos.join(', ')}
  `).bind(...valores, ...valores).run();

  return json({ mensaje: 'Configuración actualizada.' });
}

// POST /api/admin/configuracion/logo
export async function subirLogo(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form = await request.formData();
  const file = form.get('file');
  if (!file || !file.name) return error('No se recibió ningún archivo');

  const ext    = file.name.split('.').pop()?.toLowerCase() || 'webp';
  const key    = `assets/logo.${ext}`;
  const buffer = await file.arrayBuffer();
  await subirImagenAR2(env.BUCKET, key, buffer, file.type);

  const logoUrl = `${env.R2_PUBLIC_URL}/${key}`;

  await env.DB.prepare(`
    INSERT INTO configuracion (id, logo_url)
    VALUES (1, ?)
    ON CONFLICT(id) DO UPDATE SET logo_url = excluded.logo_url
  `).bind(logoUrl).run();

  return json({ url: logoUrl, mensaje: 'Logo actualizado.' });
}

// POST /api/admin/configuracion/hero
// Sube la imagen de fondo del hero a R2 y guarda la URL en D1
export async function subirHero(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form = await request.formData();
  const file = form.get('file');
  if (!file || !file.name) return error('No se recibió ningún archivo');

  const ext    = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const key    = `assets/hero.${ext}`;
  const buffer = await file.arrayBuffer();
  await subirImagenAR2(env.BUCKET, key, buffer, file.type);

  const heroUrl = `${env.R2_PUBLIC_URL}/${key}`;

  await env.DB.prepare(`
    INSERT INTO configuracion (id, hero_url)
    VALUES (1, ?)
    ON CONFLICT(id) DO UPDATE SET hero_url = excluded.hero_url
  `).bind(heroUrl).run();

  return json({ url: heroUrl, mensaje: 'Imagen de hero actualizada.' });
}

// POST /api/admin/categorias/portada
// Body: FormData con campos: slug (slug de la categoría), file (imagen)
export async function subirPortada(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form = await request.formData();
  const file = form.get('file');
  const slug = form.get('slug');

  if (!file || !file.name) return error('No se recibió ningún archivo');
  if (!slug)               return error('Falta el slug de la categoría');

  // Verificar que la categoría existe
  const cat = await env.DB.prepare(
    'SELECT slug FROM categorias WHERE slug = ?'
  ).bind(slug).first();
  if (!cat) return error('Categoría no encontrada', 404);

  // Subir a R2 como portada-{slug}.webp (o la extensión original)
  const ext      = file.name.split('.').pop()?.toLowerCase() || 'webp';
  const nombreR2 = `portada-${slug}.${ext}`;
  const buffer   = await file.arrayBuffer();
  await subirImagenAR2(env.BUCKET, nombreR2, buffer, file.type);

  // Actualizar la portada en D1
  await env.DB.prepare(
    'UPDATE categorias SET portada = ? WHERE slug = ?'
  ).bind(nombreR2, slug).run();

  return json({ url: `${env.R2_PUBLIC_URL}/${nombreR2}`, mensaje: `Portada de ${slug} actualizada.` });
}
