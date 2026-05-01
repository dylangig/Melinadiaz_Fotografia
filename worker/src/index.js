// ══════════════════════════════════════════════════════════════════════════════
// index.js — Cloudflare Worker v5
// ══════════════════════════════════════════════════════════════════════════════

import { getCorsHeaders, error, preflight } from './helpers.js';
import {
  getCategorias, getTrabajos, getTrabajoDetalle,
  getServicios, getTestimonios, getConfiguracion, getSobreMi,
} from './routes/public.js';
import {
  // Auth
  adminLogin, adminCheck,
  // Trabajos
  getTodosTrabaj, nuevoTrabajo, agregarFotos, editarTrabajo,
  eliminarTrabajo, eliminarFoto, reordenarFotos,
  // Config e imágenes
  actualizarConfiguracion, subirLogo, subirHero, subirSobreMiFoto, subirPortada,
  // Testimonios
  getTestimoniosAdmin, nuevoTestimonio, editarTestimonio, eliminarTestimonio,
  // Categorías
  guardarSobreMi, nuevaCategoria, renombrarCategoria, actualizarMostrarEnHome, eliminarCategoria,
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
      // parts = segmentos después de /api/
      // Ej: /api/admin/testimonios/nuevo → ['admin','testimonios','nuevo']
      const parts = path.replace(/^\/api\//, '').split('/').filter(Boolean);

      // ── RUTAS PÚBLICAS ────────────────────────────────────────────────────
      if (method === 'GET') {
        if (parts[0] === 'categorias'    && parts.length === 1) return withCors(await getCategorias(env), cors);
        if (parts[0] === 'servicios'     && parts.length === 1) return withCors(await getServicios(env), cors);
        if (parts[0] === 'testimonios'   && parts.length === 1) return withCors(await getTestimonios(env), cors);
        if (parts[0] === 'configuracion' && parts.length === 1) return withCors(await getConfiguracion(request, env), cors);
        if (parts[0] === 'sobre-mi'      && parts.length === 1) return withCors(await getSobreMi(env), cors);
        if (parts[0] === 'trabajos'      && parts.length === 2) return withCors(await getTrabajos(env, parts[1]), cors);
        if (parts[0] === 'trabajos'      && parts.length === 3) return withCors(await getTrabajoDetalle(env, parts[1], parts[2]), cors);
      }

      // ── RUTAS ADMIN ───────────────────────────────────────────────────────
      if (parts[0] === 'admin') {
        const [, sub, sub2] = parts; // admin / sub / sub2

        // Auth
        if (method === 'POST' && sub === 'login')  return withCors(await adminLogin(request, env), cors);
        if (method === 'GET'  && sub === 'check')  return withCors(await adminCheck(request, env), cors);

        // Trabajos
        if (method === 'GET'  && sub === 'trabajos-todos')   return withCors(await getTodosTrabaj(request, env), cors);
        if (method === 'POST' && sub === 'nuevo-trabajo')    return withCors(await nuevoTrabajo(request, env), cors);
        if (method === 'POST' && sub === 'agregar-fotos')    return withCors(await agregarFotos(request, env), cors);
        if (method === 'POST' && sub === 'editar-trabajo')   return withCors(await editarTrabajo(request, env), cors);
        if (method === 'POST' && sub === 'eliminar-trabajo') return withCors(await eliminarTrabajo(request, env), cors);
        if (method === 'POST' && sub === 'eliminar-foto')    return withCors(await eliminarFoto(request, env), cors);
        if (method === 'POST' && sub === 'reordenar-fotos')  return withCors(await reordenarFotos(request, env), cors);

        // Configuración
        if (method === 'POST' && sub === 'configuracion' && !sub2)            return withCors(await actualizarConfiguracion(request, env), cors);
        if (method === 'POST' && sub === 'configuracion' && sub2 === 'logo')  return withCors(await subirLogo(request, env), cors);
        if (method === 'POST' && sub === 'configuracion' && sub2 === 'hero')  return withCors(await subirHero(request, env), cors);
        if (method === 'POST' && sub === 'sobre-mi' && sub2 === 'foto')        return withCors(await subirSobreMiFoto(request, env), cors);
        if ((method === 'POST' || method === 'PUT') && sub === 'sobre-mi' && !sub2) return withCors(await guardarSobreMi(request, env), cors);
        if (method === 'POST' && sub === 'categorias'    && sub2 === 'portada') return withCors(await subirPortada(request, env), cors);

        // Testimonios
        if (method === 'GET'  && sub === 'testimonios' && !sub2)             return withCors(await getTestimoniosAdmin(request, env), cors);
        if (method === 'POST' && sub === 'testimonios'  && sub2 === 'nuevo') return withCors(await nuevoTestimonio(request, env), cors);
        if (method === 'POST' && sub === 'testimonios'  && sub2 === 'editar')return withCors(await editarTestimonio(request, env), cors);
        if (method === 'POST' && sub === 'testimonios'  && sub2 === 'eliminar') return withCors(await eliminarTestimonio(request, env), cors);

        // Categorías
        if (method === 'POST' && sub === 'categorias' && sub2 === 'nueva')    return withCors(await nuevaCategoria(request, env), cors);
        if (method === 'POST' && sub === 'categorias' && sub2 === 'renombrar')return withCors(await renombrarCategoria(request, env), cors);
        if (method === 'POST' && sub === 'categorias' && sub2 === 'mostrar-home') return withCors(await actualizarMostrarEnHome(request, env), cors);
        if (method === 'POST' && sub === 'categorias' && sub2 === 'eliminar') return withCors(await eliminarCategoria(request, env), cors);
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
