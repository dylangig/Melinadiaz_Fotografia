// hooks/useApi.ts — versión para Cloudflare Worker (JWT en vez de cookie de sesión)
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Categoria, Trabajo, Servicio } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

// ── Token JWT (guardado en memoria, se pierde al recargar → el admin vuelve a loguearse) ──
const STORAGE_KEY = 'mdp_admin_token';
let _adminToken: string | null = (() => {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
})();
export const setAdminToken = (t: string | null) => {
  _adminToken = t;
  try {
    if (t) localStorage.setItem(STORAGE_KEY, t);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
};
export const getAdminToken = () => _adminToken;

// ── Helper fetch con token ───────────────────────────────────────────────────
function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (_adminToken) headers['Authorization'] = `Bearer ${_adminToken}`;
  return fetch(`${API_BASE}${path}`, { cache: 'no-store', ...options, headers });
}

// ── Categorías ──────────────────────────────────────────────────────────────
// Navbar y Footer piden categorías al mismo tiempo → se comparte una única
// promise (un solo request). Cada cambio de ruta dispara un refetch, así lo
// creado en el admin aparece en el menú sin recargar la página.
let categoriasPromise: Promise<Categoria[]> | null = null;

function fetchCategorias(): Promise<Categoria[]> {
  if (!categoriasPromise) {
    categoriasPromise = apiFetch('/api/categorias')
      .then(r => r.json())
      .finally(() => { categoriasPromise = null; });
  }
  return categoriasPromise;
}

export function useCategorias() {
  const location = useLocation();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    fetchCategorias()
      .then(data => {
        if (cancelado) return;
        setCategorias(data);
        setError(null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelado) return;
        setError('No se pudieron cargar las categorías');
        setLoading(false);
      });
    return () => { cancelado = true; };
  }, [location.pathname]);

  return { categorias, loading, error };
}

// ── Trabajos por categoría ───────────────────────────────────────────────────
export function useTrabajos(categoriaSlug: string) {
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoriaSlug) return;
    setLoading(true);
    apiFetch(`/api/trabajos/${categoriaSlug}`)
      .then(r => r.json())
      .then(data => { setTrabajos(data); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar los trabajos'); setLoading(false); });
  }, [categoriaSlug]);

  return { trabajos, loading, error };
}

// ── Detalle de un trabajo ────────────────────────────────────────────────────
export function useTrabajoDetalle(categoriaSlug: string, trabajoSlug: string) {
  const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoriaSlug || !trabajoSlug) return;
    setLoading(true);
    apiFetch(`/api/trabajos/${categoriaSlug}/${trabajoSlug}`)
      .then(r => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(data => { setTrabajo(data); setLoading(false); })
      .catch(() => { setError('Trabajo no encontrado'); setLoading(false); });
  }, [categoriaSlug, trabajoSlug]);

  return { trabajo, loading, error };
}

// ── Servicios ────────────────────────────────────────────────────────────────
export function useServicios() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/servicios')
      .then(r => r.json())
      .then(data => { setServicios(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { servicios, loading };
}

// ── Admin: login ─────────────────────────────────────────────────────────────
export interface LoginResultado {
  ok: boolean;
  mensaje?: string;
}

export async function adminLogin(password: string): Promise<LoginResultado> {
  const res = await apiFetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    let mensaje = 'Contraseña incorrecta';
    try {
      const data = await res.json();
      if (data?.error) mensaje = data.error;
    } catch { /* sin cuerpo JSON */ }
    return { ok: false, mensaje };
  }
  const data = await res.json();
  if (data.token) { setAdminToken(data.token); return { ok: true }; }
  return { ok: false, mensaje: 'Respuesta inesperada del servidor' };
}

// ── Admin: check sesión ───────────────────────────────────────────────────────
export async function adminCheck(): Promise<boolean> {
  if (!_adminToken) return false;
  const res = await apiFetch('/api/admin/check');
  return res.ok;
}
