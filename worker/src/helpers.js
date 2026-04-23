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
export function json(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
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

// Comprimir y subir imagen a R2 como WebP
// Workers no tienen Pillow/sharp nativo, pero podés usar la imagen tal cual
// y aplicar transform vía Cloudflare Image Resizing si tenés el plan correcto.
// Por ahora subimos la imagen original y dejamos que R2 la sirva.
export async function subirImagenAR2(bucket, key, arrayBuffer, contentType) {
  await bucket.put(key, arrayBuffer, {
    httpMetadata: { contentType: contentType || 'image/webp' },
  });
}
