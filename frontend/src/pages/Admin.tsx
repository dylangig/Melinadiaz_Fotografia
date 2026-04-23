// pages/Admin.tsx — versión Cloudflare Worker (JWT token)
import { useState, useEffect } from 'react';
import { adminLogin, adminCheck, adminPost, getAdminToken } from '../hooks/useApi';
import type { Categoria, TrabajosData } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

export default function Admin() {
  const [authed,     setAuthed]     = useState(false);
  const [password,   setPassword]   = useState('');
  const [loginError, setLoginError] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [trabajos,   setTrabajos]   = useState<TrabajosData>({});
  const [flash,      setFlash]      = useState('');
  const [loading,    setLoading]    = useState(false);

  // Verificar token al montar (si quedó en memoria de la sesión)
  useEffect(() => {
    adminCheck().then(ok => { if (ok) { setAuthed(true); cargarDatos(); } });
  }, []);

  const cargarDatos = async () => {
    const [catRes, trabRes] = await Promise.all([
      apiFetch('/api/categorias'),
      apiFetch('/api/admin/trabajos-todos'),
    ]);
    setCategorias(await catRes.json());
    setTrabajos(await trabRes.json());
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await adminLogin(password);
    if (ok) { setAuthed(true); await cargarDatos(); }
    else    { setLoginError('Contraseña incorrecta'); }
  };

  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(''), 4000);
  };

  const postForm = async (endpoint: string, formData: FormData) => {
    setLoading(true);
    const data = await adminPost(endpoint, formData);
    showFlash(data.mensaje ?? 'Listo.');
    await cargarDatos();
    setLoading(false);
  };

  const handleNuevoTrabajo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    postForm('nuevo-trabajo', new FormData(e.currentTarget));
    (e.target as HTMLFormElement).reset();
  };

  const handleAgregarFotos = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    postForm('agregar-fotos', new FormData(e.currentTarget));
    (e.target as HTMLFormElement).reset();
  };

  const eliminarTrabajo = (categoria: string, trabajo: string) => {
    if (!confirm(`¿Eliminar '${trabajo}' y todas sus fotos?`)) return;
    const fd = new FormData();
    fd.append('categoria', categoria);
    fd.append('trabajo', trabajo);
    postForm('eliminar-trabajo', fd);
  };

  const eliminarFoto = (categoria: string, trabajo: string, foto: string) => {
    if (!confirm(`¿Eliminar la foto '${foto}'?`)) return;
    const fd = new FormData();
    fd.append('categoria', categoria);
    fd.append('trabajo', trabajo);
    fd.append('foto', foto);
    postForm('eliminar-foto', fd);
  };

  const logout = () => {
    import('../hooks/useApi').then(m => m.setAdminToken(null));
    setAuthed(false);
  };

  // ── Pantalla login ────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="max-w-sm mx-auto mt-20 text-center">
        <h2 className="font-playfair text-pink-700 text-2xl mb-8">Panel Admin</h2>
        {loginError && <p className="text-red-500 text-sm mb-4">{loginError}</p>}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-pink-200 rounded-xl text-center text-base focus:outline-none focus:border-pink-700"
          />
          <button type="submit" className="w-full py-3 bg-pink-700 text-white rounded-full font-bold hover:bg-pink-900 transition-colors">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // ── Panel ─────────────────────────────────────────────────────────────────
  return (
    <div className="py-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-playfair text-pink-700 text-3xl">Panel Admin</h1>
        <button onClick={logout} className="text-gray-400 text-sm hover:text-pink-700 transition-colors">
          Cerrar sesión
        </button>
      </div>

      {flash && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-6 text-sm font-semibold">
          ✓ {flash}
        </div>
      )}
      {loading && (
        <div className="bg-pink-50 border border-pink-200 text-pink-700 rounded-lg px-4 py-3 mb-6 text-sm">
          Procesando...
        </div>
      )}

      {/* Nuevo trabajo */}
      <section className="bg-white border border-pink-100 rounded-2xl p-6 mb-8 shadow-sm">
        <h2 className="font-playfair text-pink-700 text-xl mb-5">Nuevo trabajo</h2>
        <form onSubmit={handleNuevoTrabajo} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Nombre</label>
            <input name="nombre" required className="w-full border border-pink-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-700" placeholder="Nombre del trabajo" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Categoría</label>
            <select name="categoria" required className="w-full border border-pink-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-700">
              {categorias.map(c => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Descripción SEO</label>
            <input name="descripcion" className="w-full border border-pink-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-700" placeholder="Texto para SEO" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Descripción visible</label>
            <input name="descripcion_evento" className="w-full border border-pink-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-700" placeholder="Descripción en la galería" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Fotos</label>
            <input name="fotos" type="file" accept="image/*" multiple className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-pink-50 file:text-pink-700 file:font-semibold hover:file:bg-pink-100" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="bg-pink-700 text-white px-8 py-2.5 rounded-full font-bold text-sm hover:bg-pink-900 transition-colors">
              Crear trabajo
            </button>
          </div>
        </form>
      </section>

      {/* Agregar fotos */}
      <section className="bg-white border border-pink-100 rounded-2xl p-6 mb-8 shadow-sm">
        <h2 className="font-playfair text-pink-700 text-xl mb-5">Agregar fotos a trabajo existente</h2>
        <form onSubmit={handleAgregarFotos} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Categoría</label>
            <select name="categoria" required className="w-full border border-pink-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-700">
              {categorias.map(c => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Trabajo (slug)</label>
            <input name="trabajo" required className="w-full border border-pink-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-700" placeholder="ej: jose-maria" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Fotos</label>
            <input name="fotos" type="file" accept="image/*" multiple className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-pink-50 file:text-pink-700 file:font-semibold hover:file:bg-pink-100" />
          </div>
          <div className="sm:col-span-3">
            <button type="submit" className="bg-pink-700 text-white px-8 py-2.5 rounded-full font-bold text-sm hover:bg-pink-900 transition-colors">
              Agregar fotos
            </button>
          </div>
        </form>
      </section>

      {/* Listado de trabajos */}
      <section className="bg-white border border-pink-100 rounded-2xl p-6 shadow-sm">
        <h2 className="font-playfair text-pink-700 text-xl mb-5">Trabajos existentes</h2>
        {categorias.map(cat => (
          <div key={cat.slug} className="mb-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-pink-50 pb-2">
              {cat.nombre}
            </h3>
            {(trabajos[cat.slug] ?? []).length === 0 ? (
              <p className="text-gray-300 text-sm italic">Sin trabajos aún.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {(trabajos[cat.slug] ?? []).map(t => (
                  <div key={t.slug} className="border border-pink-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="font-semibold text-gray-700">{t.nombre}</span>
                        <span className="text-gray-400 text-xs ml-2">{t.fotos.length} fotos</span>
                      </div>
                      <button onClick={() => eliminarTrabajo(cat.slug, t.slug)} className="text-red-400 text-xs hover:text-red-600 transition-colors font-semibold">
                        Eliminar trabajo
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {t.fotos.map(foto => (
                        <div key={foto} className="relative group">
                          <img
                            src={`https://imagenes.melinadiazfotografia.com.ar/${cat.slug}/${t.slug}/${foto}`}
                            alt={foto}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => eliminarFoto(cat.slug, t.slug, foto)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
