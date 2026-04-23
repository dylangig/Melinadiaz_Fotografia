var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/helpers.js
var DEV_ORIGINS = ["http://localhost:5173", "http://localhost:3000"];
function getCorsHeaders(request, env) {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = [
    ...DEV_ORIGINS,
    ...(env.ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim()).filter(Boolean)
  ];
  const allowedOrigin = allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin"
  };
}
__name(getCorsHeaders, "getCorsHeaders");
function json(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders }
  });
}
__name(json, "json");
function error(msg, status = 400, corsHeaders = {}) {
  return json({ error: msg }, status, corsHeaders);
}
__name(error, "error");
function preflight(corsHeaders) {
  return new Response(null, { status: 204, headers: corsHeaders });
}
__name(preflight, "preflight");
function slugify(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/[\s_]+/g, "-");
}
__name(slugify, "slugify");
async function subirImagenAR2(bucket, key, arrayBuffer, contentType) {
  await bucket.put(key, arrayBuffer, {
    httpMetadata: { contentType: contentType || "image/webp" }
  });
}
__name(subirImagenAR2, "subirImagenAR2");

// src/routes/public.js
async function getCategorias(env) {
  const { results } = await env.DB.prepare(
    "SELECT nombre, slug, portada FROM categorias ORDER BY orden ASC"
  ).all();
  return json(results);
}
__name(getCategorias, "getCategorias");
async function getTrabajos(env, categoriaSlug) {
  const cat = await env.DB.prepare(
    "SELECT slug FROM categorias WHERE slug = ?"
  ).bind(categoriaSlug).first();
  if (!cat) return error("Categor\xEDa no encontrada", 404);
  const { results: trabajos } = await env.DB.prepare(
    `SELECT id, slug, nombre, a\xF1o, descripcion, descripcion_evento
     FROM trabajos
     WHERE categoria_slug = ? AND activo = 1
     ORDER BY orden ASC, id ASC`
  ).bind(categoriaSlug).all();
  const trabajosConFotos = await Promise.all(
    trabajos.map(async (t) => {
      const { results: fotos } = await env.DB.prepare(
        "SELECT nombre FROM fotos WHERE trabajo_id = ? ORDER BY orden ASC, id ASC"
      ).bind(t.id).all();
      return {
        slug: t.slug,
        nombre: t.nombre,
        a\u00F1o: t.a\u00F1o,
        descripcion: t.descripcion ?? null,
        descripcion_evento: t.descripcion_evento ?? null,
        fotos: fotos.map((f) => f.nombre)
      };
    })
  );
  return json(trabajosConFotos);
}
__name(getTrabajos, "getTrabajos");
async function getTrabajoDetalle(env, categoriaSlug, trabajoSlug) {
  const trabajo = await env.DB.prepare(
    `SELECT id, slug, nombre, a\xF1o, descripcion, descripcion_evento
     FROM trabajos
     WHERE categoria_slug = ? AND slug = ? AND activo = 1`
  ).bind(categoriaSlug, trabajoSlug).first();
  if (!trabajo) return error("Trabajo no encontrado", 404);
  const { results: fotos } = await env.DB.prepare(
    "SELECT nombre FROM fotos WHERE trabajo_id = ? ORDER BY orden ASC, id ASC"
  ).bind(trabajo.id).all();
  return json({
    slug: trabajo.slug,
    nombre: trabajo.nombre,
    a\u00F1o: trabajo.a\u00F1o,
    descripcion: trabajo.descripcion ?? null,
    descripcion_evento: trabajo.descripcion_evento ?? null,
    fotos: fotos.map((f) => f.nombre)
  });
}
__name(getTrabajoDetalle, "getTrabajoDetalle");
async function getServicios(env) {
  const { results } = await env.DB.prepare(
    "SELECT nombre, descripcion, fotos_json FROM servicios ORDER BY orden ASC"
  ).all();
  return json(results.map((s) => ({
    nombre: s.nombre,
    descripcion: s.descripcion,
    fotos: JSON.parse(s.fotos_json ?? "[]")
  })));
}
__name(getServicios, "getServicios");

// src/auth.js
var TOKEN_EXPIRY_HOURS = 24;
function strToBuffer(str) {
  return new TextEncoder().encode(str);
}
__name(strToBuffer, "strToBuffer");
async function generarToken(jwtSecret) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({
    admin: true,
    exp: Math.floor(Date.now() / 1e3) + TOKEN_EXPIRY_HOURS * 3600
  }));
  const data = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    strToBuffer(jwtSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, strToBuffer(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${sigB64}`;
}
__name(generarToken, "generarToken");
async function verificarToken(token, jwtSecret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [header, payload, sigB64] = parts;
    const data = `${header}.${payload}`;
    const key = await crypto.subtle.importKey(
      "raw",
      strToBuffer(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const sigBuf = Uint8Array.from(atob(sigB64), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, sigBuf, strToBuffer(data));
    if (!valid) return false;
    const { exp } = JSON.parse(atob(payload));
    return Math.floor(Date.now() / 1e3) < exp;
  } catch {
    return false;
  }
}
__name(verificarToken, "verificarToken");
function tokenDesdeRequest(request) {
  const auth = request.headers.get("Authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}
__name(tokenDesdeRequest, "tokenDesdeRequest");

// src/routes/admin.js
async function requireAdmin(request, env) {
  const token = tokenDesdeRequest(request);
  if (!token) return false;
  return verificarToken(token, env.JWT_SECRET);
}
__name(requireAdmin, "requireAdmin");
async function adminLogin(request, env) {
  const body = await request.json().catch(() => ({}));
  if (body.password !== env.ADMIN_PASSWORD) {
    return error("Contrase\xF1a incorrecta", 401);
  }
  const token = await generarToken(env.JWT_SECRET);
  return json({ ok: true, token });
}
__name(adminLogin, "adminLogin");
async function adminCheck(request, env) {
  const ok = await requireAdmin(request, env);
  if (!ok) return error("No autorizado", 401);
  return json({ ok: true });
}
__name(adminCheck, "adminCheck");
async function getTodosTrabaj(request, env) {
  if (!await requireAdmin(request, env)) return error("No autorizado", 401);
  const { results: cats } = await env.DB.prepare(
    "SELECT slug FROM categorias ORDER BY orden ASC"
  ).all();
  const resultado = {};
  for (const cat of cats) {
    const { results: trabajos } = await env.DB.prepare(
      `SELECT id, slug, nombre, a\xF1o, descripcion, descripcion_evento
       FROM trabajos WHERE categoria_slug = ? ORDER BY orden ASC, id ASC`
    ).bind(cat.slug).all();
    resultado[cat.slug] = await Promise.all(trabajos.map(async (t) => {
      const { results: fotos } = await env.DB.prepare(
        "SELECT nombre FROM fotos WHERE trabajo_id = ? ORDER BY orden ASC, id ASC"
      ).bind(t.id).all();
      return { ...t, fotos: fotos.map((f) => f.nombre) };
    }));
  }
  return json(resultado);
}
__name(getTodosTrabaj, "getTodosTrabaj");
async function nuevoTrabajo(request, env) {
  if (!await requireAdmin(request, env)) return error("No autorizado", 401);
  const form = await request.formData();
  const categoria = form.get("categoria");
  const nombre = form.get("nombre")?.trim();
  if (!categoria || !nombre) return error("Faltan campos obligatorios");
  const slug = slugify(nombre);
  const descripcion = form.get("descripcion")?.trim() || null;
  const descripcionEvento = form.get("descripcion_evento")?.trim() || null;
  const { meta } = await env.DB.prepare(
    `INSERT OR IGNORE INTO trabajos (categoria_slug, slug, nombre, descripcion, descripcion_evento)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(categoria, slug, nombre, descripcion, descripcionEvento).run();
  const trabajoId = meta.last_row_id;
  if (!trabajoId) return error("El trabajo ya existe o hubo un error", 409);
  let guardadas = 0;
  const fotos = form.getAll("fotos");
  for (const [idx, foto] of fotos.entries()) {
    if (!foto || !foto.name) continue;
    const ext = foto.name.split(".").pop()?.toLowerCase() || "webp";
    const nombreR2 = `${idx + 1}.${ext}`;
    const key = `${categoria}/${slug}/${nombreR2}`;
    const buffer = await foto.arrayBuffer();
    await subirImagenAR2(env.BUCKET, key, buffer, foto.type);
    await env.DB.prepare(
      "INSERT INTO fotos (trabajo_id, nombre, orden) VALUES (?, ?, ?)"
    ).bind(trabajoId, nombreR2, idx + 1).run();
    guardadas++;
  }
  return json({ mensaje: `Trabajo '${slug}' creado con ${guardadas} fotos.` });
}
__name(nuevoTrabajo, "nuevoTrabajo");
async function agregarFotos(request, env) {
  if (!await requireAdmin(request, env)) return error("No autorizado", 401);
  const form = await request.formData();
  const categoria = form.get("categoria");
  const trabajoSlug = form.get("trabajo");
  const trabajo = await env.DB.prepare(
    "SELECT id FROM trabajos WHERE categoria_slug = ? AND slug = ?"
  ).bind(categoria, trabajoSlug).first();
  if (!trabajo) return error("Trabajo no encontrado", 404);
  const maxOrden = await env.DB.prepare(
    "SELECT COALESCE(MAX(orden), 0) as m FROM fotos WHERE trabajo_id = ?"
  ).bind(trabajo.id).first();
  let ordenBase = maxOrden?.m ?? 0;
  let guardadas = 0;
  const fotos = form.getAll("fotos");
  for (const [idx, foto] of fotos.entries()) {
    if (!foto || !foto.name) continue;
    const ext = foto.name.split(".").pop()?.toLowerCase() || "webp";
    const orden = ordenBase + idx + 1;
    const nombreR2 = `${orden}.${ext}`;
    const key = `${categoria}/${trabajoSlug}/${nombreR2}`;
    const buffer = await foto.arrayBuffer();
    await subirImagenAR2(env.BUCKET, key, buffer, foto.type);
    await env.DB.prepare(
      "INSERT INTO fotos (trabajo_id, nombre, orden) VALUES (?, ?, ?)"
    ).bind(trabajo.id, nombreR2, orden).run();
    guardadas++;
  }
  return json({ mensaje: `${guardadas} fotos agregadas a '${trabajoSlug}'.` });
}
__name(agregarFotos, "agregarFotos");
async function editarTrabajo(request, env) {
  if (!await requireAdmin(request, env)) return error("No autorizado", 401);
  const form = await request.formData();
  const categoria = form.get("categoria");
  const trabajoSlug = form.get("trabajo");
  const descripcion = form.get("descripcion")?.trim() || null;
  const descripcionEvento = form.get("descripcion_evento")?.trim() || null;
  await env.DB.prepare(
    `UPDATE trabajos SET descripcion = ?, descripcion_evento = ?
     WHERE categoria_slug = ? AND slug = ?`
  ).bind(descripcion, descripcionEvento, categoria, trabajoSlug).run();
  return json({ mensaje: `Trabajo '${trabajoSlug}' actualizado.` });
}
__name(editarTrabajo, "editarTrabajo");
async function eliminarTrabajo(request, env) {
  if (!await requireAdmin(request, env)) return error("No autorizado", 401);
  const form = await request.formData();
  const categoria = form.get("categoria");
  const trabajoSlug = form.get("trabajo");
  const trabajo = await env.DB.prepare(
    "SELECT id FROM trabajos WHERE categoria_slug = ? AND slug = ?"
  ).bind(categoria, trabajoSlug).first();
  if (!trabajo) return error("Trabajo no encontrado", 404);
  const { results: fotos } = await env.DB.prepare(
    "SELECT nombre FROM fotos WHERE trabajo_id = ?"
  ).bind(trabajo.id).all();
  await Promise.all(
    fotos.map((f) => env.BUCKET.delete(`${categoria}/${trabajoSlug}/${f.nombre}`))
  );
  await env.DB.prepare(
    "DELETE FROM trabajos WHERE id = ?"
  ).bind(trabajo.id).run();
  return json({ mensaje: `Trabajo '${trabajoSlug}' eliminado.` });
}
__name(eliminarTrabajo, "eliminarTrabajo");
async function eliminarFoto(request, env) {
  if (!await requireAdmin(request, env)) return error("No autorizado", 401);
  const form = await request.formData();
  const categoria = form.get("categoria");
  const trabajoSlug = form.get("trabajo");
  const fotoNombre = form.get("foto");
  const trabajo = await env.DB.prepare(
    "SELECT id FROM trabajos WHERE categoria_slug = ? AND slug = ?"
  ).bind(categoria, trabajoSlug).first();
  if (!trabajo) return error("Trabajo no encontrado", 404);
  const key = `${categoria}/${trabajoSlug}/${fotoNombre}`;
  await env.BUCKET.delete(key);
  await env.DB.prepare(
    "DELETE FROM fotos WHERE trabajo_id = ? AND nombre = ?"
  ).bind(trabajo.id, fotoNombre).run();
  return json({ mensaje: `Foto '${fotoNombre}' eliminada.` });
}
__name(eliminarFoto, "eliminarFoto");
async function reordenarFotos(request, env) {
  if (!await requireAdmin(request, env)) return error("No autorizado", 401);
  const { categoria, trabajo: trabajoSlug, orden } = await request.json();
  const trabajo = await env.DB.prepare(
    "SELECT id FROM trabajos WHERE categoria_slug = ? AND slug = ?"
  ).bind(categoria, trabajoSlug).first();
  if (!trabajo) return error("Trabajo no encontrado", 404);
  await Promise.all(
    orden.map(
      (nombreFoto, idx) => env.DB.prepare(
        "UPDATE fotos SET orden = ? WHERE trabajo_id = ? AND nombre = ?"
      ).bind(idx + 1, trabajo.id, nombreFoto).run()
    )
  );
  return json({ mensaje: "Fotos reordenadas correctamente." });
}
__name(reordenarFotos, "reordenarFotos");

// src/index.js
var src_default = {
  async fetch(request, env) {
    const cors = getCorsHeaders(request, env);
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") return preflight(cors);
    if (!path.startsWith("/api/")) {
      return new Response("Not found", { status: 404, headers: cors });
    }
    try {
      const segments = path.split("/").filter(Boolean);
      const [, ...parts] = segments;
      if (method === "GET" && parts[0] === "categorias") {
        return withCors(await getCategorias(env), cors);
      }
      if (method === "GET" && parts[0] === "servicios") {
        return withCors(await getServicios(env), cors);
      }
      if (method === "GET" && parts[0] === "trabajos" && parts.length === 2) {
        return withCors(await getTrabajos(env, parts[1]), cors);
      }
      if (method === "GET" && parts[0] === "trabajos" && parts.length === 3) {
        return withCors(await getTrabajoDetalle(env, parts[1], parts[2]), cors);
      }
      if (method === "POST" && parts[0] === "admin" && parts[1] === "login") {
        return withCors(await adminLogin(request, env), cors);
      }
      if (method === "GET" && parts[0] === "admin" && parts[1] === "check") {
        return withCors(await adminCheck(request, env), cors);
      }
      if (method === "GET" && parts[0] === "admin" && parts[1] === "trabajos-todos") {
        return withCors(await getTodosTrabaj(request, env), cors);
      }
      if (method === "POST" && parts[0] === "admin" && parts[1] === "nuevo-trabajo") {
        return withCors(await nuevoTrabajo(request, env), cors);
      }
      if (method === "POST" && parts[0] === "admin" && parts[1] === "agregar-fotos") {
        return withCors(await agregarFotos(request, env), cors);
      }
      if (method === "POST" && parts[0] === "admin" && parts[1] === "editar-trabajo") {
        return withCors(await editarTrabajo(request, env), cors);
      }
      if (method === "POST" && parts[0] === "admin" && parts[1] === "eliminar-trabajo") {
        return withCors(await eliminarTrabajo(request, env), cors);
      }
      if (method === "POST" && parts[0] === "admin" && parts[1] === "eliminar-foto") {
        return withCors(await eliminarFoto(request, env), cors);
      }
      if (method === "POST" && parts[0] === "admin" && parts[1] === "reordenar-fotos") {
        return withCors(await reordenarFotos(request, env), cors);
      }
      return withCors(error("Ruta no encontrada", 404), cors);
    } catch (err) {
      console.error("Worker error:", err);
      return withCors(
        new Response(JSON.stringify({ error: "Error interno del servidor", detail: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }),
        cors
      );
    }
  }
};
function withCors(response, cors) {
  const r = new Response(response.body, response);
  Object.entries(cors).forEach(([k, v]) => r.headers.set(k, v));
  return r;
}
__name(withCors, "withCors");

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-YNCbEC/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = src_default;

// ../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-YNCbEC/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
