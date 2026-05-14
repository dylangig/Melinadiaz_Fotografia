// ── helpers.js ───────────────────────────────────────────────────────────────

// Orígenes permitidos (se agrega localhost siempre para desarrollo)
const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];

export function getCorsHeaders(request, env) {
  const origin  = request.headers.get('Origin') ?? '';
  const allowed = [
    ...DEV_ORIGINS,
    ...(env.ALLOWED_ORIGINS ?? '').split(',').map(o => o.trim()).filter(Boolean),
  ];
  const allowedOrigin = allowed.includes(origin) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin':      allowedOrigin,
    'Access-Control-Allow-Methods':     'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':     'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };
}

// Respuesta JSON con CORS
export function json(data, status = 200, corsHeaders = {}, maxAge = 0) {
  const headers = { 'Content-Type': 'application/json', ...corsHeaders };
  if (maxAge > 0) headers['Cache-Control'] = `public, max-age=${maxAge}, s-maxage=${maxAge}`;
  else headers['Cache-Control'] = 'no-store';
  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

// Respuesta de error
export function error(msg, status = 400, corsHeaders = {}) {
  return json({ error: msg }, status, corsHeaders);
}

// Preflight OPTIONS para CORS
export function preflight(corsHeaders) {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Slugify: convierte "José María" → "jose-maria"
export function slugify(texto) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-');
}

export function booleanFromDb(value) {
  return value === true || value === 1 || value === '1';
}

export function booleanFromRequest(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    return ['1', 'true', 'on', 'yes', 'si', 'sí'].includes(value.trim().toLowerCase());
  }
  return false;
}

// Comprimir y subir imagen a R2 como WebP
// Workers no tienen Pillow/sharp nativo, pero podés usar la imagen tal cual
// y aplicar transform vía Cloudflare Image Resizing si tenés el plan correcto.
// Por ahora subimos la imagen original y dejamos que R2 la sirva.
export async function subirImagenAR2(bucket, key, arrayBuffer, contentType) {
  await bucket.put(key, arrayBuffer, {
    httpMetadata: { contentType: contentType || 'image/webp', cacheControl: 'public, max-age=31536000, immutable' },
  });
}
