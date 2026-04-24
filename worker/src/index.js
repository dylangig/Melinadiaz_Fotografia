// ══════════════════════════════════════════════════════════════════════════════
// index.js — Cloudflare Worker principal
// ══════════════════════════════════════════════════════════════════════════════

import { getCorsHeaders, json, error, preflight } from './helpers.js';
import { getCategorias, getTrabajos, getTrabajoDetalle, getServicios } from './routes/public.js';
import {
  adminLogin, adminCheck, getTodosTrabaj,
  nuevoTrabajo, agregarFotos, editarTrabajo,
  eliminarTrabajo, eliminarFoto, reordenarFotos,
  getConfiguracion, actualizarConfiguracion,
  subirLogo, subirHero, subirPortada,
} from './routes/admin.js';

export default {
  async fetch(request, env) {
    const cors   = getCorsHeaders(request, env);
    const url    = new URL(request.url);
    const path   = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return preflight(cors);

    if (!path.startsWith('/api/')) {
      return new Response('Not found', { status: 404, headers: cors });
    }

    try {
      const segments = path.split('/').filter(Boolean);
      const [, ...parts] = segments;

      // ── RUTAS PÚBLICAS ──────────────────────────────────────────────────

      // GET /api/categorias
      if (method === 'GET' && parts[0] === 'categorias' && parts.length === 1) {
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

      // GET /api/configuracion
      if (method === 'GET' && parts[0] === 'configuracion') {
        return withCors(await getConfiguracion(env), cors);
      }

      // ── RUTAS ADMIN ─────────────────────────────────────────────────────

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

      // POST /api/admin/configuracion  (nombre_marca, hero_url)
      if (method === 'POST' && parts[0] === 'admin' && parts[1] === 'configuracion' && parts.length === 2) {
        return withCors(await actualizarConfiguracion(request, env), cors);
      }

      // POST /api/admin/configuracion/logo
      if (method === 'POST' && parts[0] === 'admin' && parts[1] === 'configuracion' && parts[2] === 'logo') {
        return withCors(await subirLogo(request, env), cors);
      }

      // POST /api/admin/configuracion/hero
      if (method === 'POST' && parts[0] === 'admin' && parts[1] === 'configuracion' && parts[2] === 'hero') {
        return withCors(await subirHero(request, env), cors);
      }

      // POST /api/admin/categorias/portada
      if (method === 'POST' && parts[0] === 'admin' && parts[1] === 'categorias' && parts[2] === 'portada') {
        return withCors(await subirPortada(request, env), cors);
      }

      return withCors(error('Ruta no encontrada', 404), cors);

    } catch (err) {
      console.error('Worker error:', err);
      return withCors(
        new Response(JSON.stringify({ error: 'Error interno', detail: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
        cors
      );
    }
  },
};

function withCors(response, cors) {
  const r = new Response(response.body, response);
  Object.entries(cors).forEach(([k, v]) => r.headers.set(k, v));
  return r;
}
