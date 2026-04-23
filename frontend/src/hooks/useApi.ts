// hooks/useApi.ts — versión para Cloudflare Worker (JWT en vez de cookie de sesión)
import { useState, useEffect } from 'react';
import type { Categoria, Trabajo, Servicio } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

// ── Token JWT (guardado en memoria, se pierde al recargar → el admin vuelve a loguearse) ──
let _adminToken: string | null = null;
export const setAdminToken = (t: string | null) => { _adminToken = t; };
export const getAdminToken = () => _adminToken;

// ── Helper fetch con token ───────────────────────────────────────────────────
function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (_adminToken) headers['Authorization'] = `Bearer ${_adminToken}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

// ── Categorías ──────────────────────────────────────────────────────────────
export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/categorias')
      .then(r => r.json())
      .then(data => { setCategorias(data); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar las categorías'); setLoading(false); });
  }, []);

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
export async function adminLogin(password: string): Promise<boolean> {
  const res = await apiFetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  if (data.token) { setAdminToken(data.token); return true; }
  return false;
}

// ── Admin: check sesión ───────────────────────────────────────────────────────
export async function adminCheck(): Promise<boolean> {
  if (!_adminToken) return false;
  const res = await apiFetch('/api/admin/check');
  return res.ok;
}

// ── Admin: fetch helper con FormData ─────────────────────────────────────────
export async function adminPost(endpoint: string, formData: FormData) {
  const res = await apiFetch(`/api/admin/${endpoint}`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
}
