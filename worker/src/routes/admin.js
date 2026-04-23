// ── routes/admin.js ──────────────────────────────────────────────────────────
// Endpoints del panel de administración (requieren token JWT)

import { json, error, slugify, subirImagenAR2 } from '../helpers.js';
import { generarToken, verificarToken, tokenDesdeRequest } from '../auth.js';

// ── Middleware: verificar token ───────────────────────────────────────────────
async function requireAdmin(request, env) {
  const token = tokenDesdeRequest(request);
  if (!token) return false;
  return verificarToken(token, env.JWT_SECRET);
}

// POST /api/admin/login
// Body JSON: { password: "..." }
export async function adminLogin(request, env) {
  const body = await request.json().catch(() => ({}));
  if (body.password !== env.ADMIN_PASSWORD) {
    return error('Contraseña incorrecta', 401);
  }
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
// Body: FormData con campos: categoria, nombre, descripcion?, descripcion_evento?, fotos (files)
export async function nuevoTrabajo(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form      = await request.formData();
  const categoria = form.get('categoria');
  const nombre    = form.get('nombre')?.trim();
  if (!categoria || !nombre) return error('Faltan campos obligatorios');

  const slug             = slugify(nombre);
  const descripcion      = form.get('descripcion')?.trim()       || null;
  const descripcionEvento= form.get('descripcion_evento')?.trim()|| null;

  // Insertar trabajo en D1
  const { meta } = await env.DB.prepare(
    `INSERT OR IGNORE INTO trabajos (categoria_slug, slug, nombre, descripcion, descripcion_evento)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(categoria, slug, nombre, descripcion, descripcionEvento).run();

  const trabajoId = meta.last_row_id;
  if (!trabajoId) return error('El trabajo ya existe o hubo un error', 409);

  // Subir fotos a R2 y registrar en D1
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
// Body: FormData con campos: categoria, trabajo, fotos (files)
export async function agregarFotos(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form      = await request.formData();
  const categoria = form.get('categoria');
  const trabajoSlug = form.get('trabajo');

  const trabajo = await env.DB.prepare(
    'SELECT id FROM trabajos WHERE categoria_slug = ? AND slug = ?'
  ).bind(categoria, trabajoSlug).first();
  if (!trabajo) return error('Trabajo no encontrado', 404);

  // Determinar el máximo orden actual
  const maxOrden = await env.DB.prepare(
    'SELECT COALESCE(MAX(orden), 0) as m FROM fotos WHERE trabajo_id = ?'
  ).bind(trabajo.id).first();
  let ordenBase = (maxOrden?.m ?? 0);

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
// Body: FormData con campos: categoria, trabajo, descripcion?, descripcion_evento?
export async function editarTrabajo(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form             = await request.formData();
  const categoria        = form.get('categoria');
  const trabajoSlug      = form.get('trabajo');
  const descripcion      = form.get('descripcion')?.trim()        || null;
  const descripcionEvento= form.get('descripcion_evento')?.trim() || null;

  await env.DB.prepare(
    `UPDATE trabajos SET descripcion = ?, descripcion_evento = ?
     WHERE categoria_slug = ? AND slug = ?`
  ).bind(descripcion, descripcionEvento, categoria, trabajoSlug).run();

  return json({ mensaje: `Trabajo '${trabajoSlug}' actualizado.` });
}

// POST /api/admin/eliminar-trabajo
// Body: FormData con campos: categoria, trabajo
export async function eliminarTrabajo(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const form        = await request.formData();
  const categoria   = form.get('categoria');
  const trabajoSlug = form.get('trabajo');

  const trabajo = await env.DB.prepare(
    'SELECT id FROM trabajos WHERE categoria_slug = ? AND slug = ?'
  ).bind(categoria, trabajoSlug).first();
  if (!trabajo) return error('Trabajo no encontrado', 404);

  // Eliminar fotos de R2
  const { results: fotos } = await env.DB.prepare(
    'SELECT nombre FROM fotos WHERE trabajo_id = ?'
  ).bind(trabajo.id).all();

  await Promise.all(
    fotos.map(f => env.BUCKET.delete(`${categoria}/${trabajoSlug}/${f.nombre}`))
  );

  // Eliminar de D1 (las fotos se eliminan por CASCADE)
  await env.DB.prepare(
    'DELETE FROM trabajos WHERE id = ?'
  ).bind(trabajo.id).run();

  return json({ mensaje: `Trabajo '${trabajoSlug}' eliminado.` });
}

// POST /api/admin/eliminar-foto
// Body: FormData con campos: categoria, trabajo, foto
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

  const key = `${categoria}/${trabajoSlug}/${fotoNombre}`;
  await env.BUCKET.delete(key);

  await env.DB.prepare(
    'DELETE FROM fotos WHERE trabajo_id = ? AND nombre = ?'
  ).bind(trabajo.id, fotoNombre).run();

  return json({ mensaje: `Foto '${fotoNombre}' eliminada.` });
}

// POST /api/admin/reordenar-fotos
// Body JSON: { categoria, trabajo, orden: ["1.webp", "3.webp", "2.webp"] }
export async function reordenarFotos(request, env) {
  if (!await requireAdmin(request, env)) return error('No autorizado', 401);

  const { categoria, trabajo: trabajoSlug, orden } = await request.json();

  const trabajo = await env.DB.prepare(
    'SELECT id FROM trabajos WHERE categoria_slug = ? AND slug = ?'
  ).bind(categoria, trabajoSlug).first();
  if (!trabajo) return error('Trabajo no encontrado', 404);

  // Actualizar el campo orden en D1 según el array recibido
  await Promise.all(
    orden.map((nombreFoto, idx) =>
      env.DB.prepare(
        'UPDATE fotos SET orden = ? WHERE trabajo_id = ? AND nombre = ?'
      ).bind(idx + 1, trabajo.id, nombreFoto).run()
    )
  );

  return json({ mensaje: 'Fotos reordenadas correctamente.' });
}
