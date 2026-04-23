// ══════════════════════════════════════════════════════════════════════════════
// index.js — Cloudflare Worker principal
// Melina Diaz Fotografía — API completa
//
// Rutas disponibles:
//   GET  /api/categorias
//   GET  /api/trabajos/:categoria
//   GET  /api/trabajos/:categoria/:trabajo
//   GET  /api/servicios
//   POST /api/admin/login
//   GET  /api/admin/check
//   GET  /api/admin/trabajos-todos
//   POST /api/admin/nuevo-trabajo
//   POST /api/admin/agregar-fotos
//   POST /api/admin/editar-trabajo
//   POST /api/admin/eliminar-trabajo
//   POST /api/admin/eliminar-foto
//   POST /api/admin/reordenar-fotos
// ══════════════════════════════════════════════════════════════════════════════

import { getCorsHeaders, json, error, preflight } from './helpers.js';
import { getCategorias, getTrabajos, getTrabajoDetalle, getServicios } from './routes/public.js';
import {
  adminLogin, adminCheck, getTodosTrabaj,
  nuevoTrabajo, agregarFotos, editarTrabajo,
  eliminarTrabajo, eliminarFoto, reordenarFotos,
} from './routes/admin.js';

export default {
  async fetch(request, env) {
    const cors = getCorsHeaders(request, env);
    const url  = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // ── Preflight CORS ──────────────────────────────────────────────────────
    if (method === 'OPTIONS') return preflight(cors);

    // ── Solo procesar rutas /api/* ──────────────────────────────────────────
    if (!path.startsWith('/api/')) {
      return new Response('Not found', { status: 404, headers: cors });
    }

    try {
      // Extraer segmentos de la URL
      // /api/categorias → ['', 'api', 'categorias']
      const segments = path.split('/').filter(Boolean); // ['api', 'categorias', ...]
      const [, ...parts] = segments; // parts = ['categorias', ...]

      // ── Rutas públicas ────────────────────────────────────────────────────

      // GET /api/categorias
      if (method === 'GET' && parts[0] === 'categorias') {
        return withCors(await getCategorias(env), cors);
      }

      // GET /api/servicios
      if (method === 'GET' && parts[0] === 'servicios') {
        return withCors(await getServicios(env), cors);
      }

      // GET /api/trabajos/:categoria
      if (method === 'GET' && parts[0] === 'trabajos' && parts.length === 2) {
        return withCors(await getTrabajos(env, parts[1]), cors);
      }

      // GET /api/trabajos/:categoria/:trabajo
      if (method === 'GET' && parts[0] === 'trabajos' && parts.length === 3) {
        return withCors(await getTrabajoDetalle(env, parts[1], parts[2]), cors);
      }

      // ── Rutas admin ───────────────────────────────────────────────────────

      // POST /api/admin/login
      if (method === 'POST' && parts[0] === 'admin' && parts[1] === 'login') {
        return withCors(await adminLogin(request, env), cors);
      }

      // GET /api/admin/check
      if (method === 'GET' && parts[0] === 'admin' && parts[1] === 'check') {
        return withCors(await adminCheck(request, env), cors);
      }

      // GET /api/admin/trabajos-todos
      if (method === 'GET' && parts[0] === 'admin' && parts[1] === 'trabajos-todos') {
        return withCors(await getTodosTrabaj(request, env), cors);
      }

      // POST /api/admin/nuevo-trabajo
      if (method === 'POST' && parts[0] === 'admin' && parts[1] === 'nuevo-trabajo') {
        return withCors(await nuevoTrabajo(request, env), cors);
      }

      // POST /api/admin/agregar-fotos
      if (method === 'POST' && parts[0] === 'admin' && parts[1] === 'agregar-fotos') {
        return withCors(await agregarFotos(request, env), cors);
      }

      // POST /api/admin/editar-trabajo
      if (method === 'POST' && parts[0] === 'admin' && parts[1] === 'editar-trabajo') {
        return withCors(await editarTrabajo(request, env), cors);
      }

      // POST /api/admin/eliminar-trabajo
      if (method === 'POST' && parts[0] === 'admin' && parts[1] === 'eliminar-trabajo') {
        return withCors(await eliminarTrabajo(request, env), cors);
      }

      // POST /api/admin/eliminar-foto
      if (method === 'POST' && parts[0] === 'admin' && parts[1] === 'eliminar-foto') {
        return withCors(await eliminarFoto(request, env), cors);
      }

      // POST /api/admin/reordenar-fotos
      if (method === 'POST' && parts[0] === 'admin' && parts[1] === 'reordenar-fotos') {
        return withCors(await reordenarFotos(request, env), cors);
      }

      // Ruta no encontrada
      return withCors(error('Ruta no encontrada', 404), cors);

    } catch (err) {
      console.error('Worker error:', err);
      return withCors(
        new Response(JSON.stringify({ error: 'Error interno del servidor', detail: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
        cors
      );
    }
  },
};

// Agrega headers CORS a una Response existente
function withCors(response, cors) {
  const r = new Response(response.body, response);
  Object.entries(cors).forEach(([k, v]) => r.headers.set(k, v));
  return r;
}
