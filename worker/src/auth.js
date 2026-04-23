// ── auth.js ─────────────────────────────────────────────────────────────────
// Autenticación del panel admin usando JWT firmado con HMAC-SHA256.
// No hay sesiones (Workers son stateless), así que usamos un token
// que el frontend guarda en memoria/cookie y manda en cada request.

const TOKEN_EXPIRY_HOURS = 24;

// Convierte un string a ArrayBuffer
function strToBuffer(str) {
  return new TextEncoder().encode(str);
}

// Genera un JWT simple (header.payload.firma) con HMAC-SHA256
export async function generarToken(jwtSecret) {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    admin: true,
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_HOURS * 3600,
  }));
  const data = `${header}.${payload}`;
  const key  = await crypto.subtle.importKey(
    'raw', strToBuffer(jwtSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, strToBuffer(data));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${data}.${sigB64}`;
}

// Verifica el token y devuelve true si es válido y no expiró
export async function verificarToken(token, jwtSecret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, payload, sigB64] = parts;
    const data = `${header}.${payload}`;
    const key  = await crypto.subtle.importKey(
      'raw', strToBuffer(jwtSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
    const sigBuf = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));
    const valid  = await crypto.subtle.verify('HMAC', key, sigBuf, strToBuffer(data));
    if (!valid) return false;
    const { exp } = JSON.parse(atob(payload));
    return Math.floor(Date.now() / 1000) < exp;
  } catch {
    return false;
  }
}

// Extrae el token del header Authorization: Bearer <token>
export function tokenDesdeRequest(request) {
  const auth = request.headers.get('Authorization') ?? '';
  return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}
