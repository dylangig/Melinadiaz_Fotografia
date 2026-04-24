import { useState, useEffect, useRef } from 'react';
import { adminLogin, adminCheck, getAdminToken, setAdminToken } from '../hooks/useApi';
import type { Categoria, TrabajosData } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';
const R2       = 'https://imagenes.melinadiazfotografia.com.ar';

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

interface Config {
  logo_url:     string;
  nombre_marca: string;
  hero_url:     string;
}

interface CategoriaConPortada extends Categoria {
  portada: string;
}

export default function Admin() {
  const [authed,     setAuthed]     = useState(false);
  const [password,   setPassword]   = useState('');
  const [loginError, setLoginError] = useState('');
  const [categorias, setCategorias] = useState<CategoriaConPortada[]>([]);
  const [trabajos,   setTrabajos]   = useState<TrabajosData>({});
  const [config,     setConfig]     = useState<Config>({ logo_url: '', nombre_marca: '', hero_url: '' });
  const [flash,      setFlash]      = useState('');
  const [loading,    setLoading]    = useState(false);

  const [seccionAbierta,  setSeccionAbierta]  = useState<string | null>(null);
  const [editando,        setEditando]        = useState<{ cat: string; slug: string; desc: string; descEvento: string } | null>(null);
  const [agregarEnTrabajo, setAgregarEnTrabajo] = useState<{ cat: string; slug: string } | null>(null);

  useEffect(() => {
    adminCheck().then(ok => { if (ok) { setAuthed(true); cargarTodo(); } });
  }, []);

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [catRes, trabRes, confRes] = await Promise.all([
        apiFetch('/api/categorias'),
        apiFetch('/api/admin/trabajos-todos'),
        apiFetch('/api/configuracion'),
      ]);
      if (catRes.ok)  setCategorias(await catRes.json());
      if (trabRes.ok) setTrabajos(await trabRes.json());
      if (confRes.ok) setConfig(await confRes.json());
    } catch { showFlash('Error al conectar con el Worker'); }
    finally  { setLoading(false); }
  };

  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(''), 3500);
  };

  // ── Login ───────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await adminLogin(password);
    if (ok) { setAuthed(true); cargarTodo(); }
    else    setLoginError('Contraseña incorrecta');
  };

  const logout = () => { setAdminToken(null); setAuthed(false); };

  // ── POST FormData helper ────────────────────────────────────────────────────
  const postForm = async (endpoint: string, fd: FormData) => {
    setLoading(true);
    try {
      const res  = await apiFetch(`/api/admin/${endpoint}`, { method: 'POST', body: fd });
      const data = await res.json();
      showFlash(data.mensaje ?? (res.ok ? 'Listo.' : 'Error.'));
      if (res.ok) await cargarTodo();
    } catch { showFlash('Error de conexión'); }
    finally { setLoading(false); }
  };

  // ── Subir imagen genérica (logo, hero, portada) ─────────────────────────────
  const subirImagen = async (endpoint: string, file: File, extraFields?: Record<string, string>) => {
    const fd = new FormData();
    fd.append('file', file);
    if (extraFields) Object.entries(extraFields).forEach(([k, v]) => fd.append(k, v));
    setLoading(true);
    try {
      const res  = await apiFetch(`/api/admin/${endpoint}`, { method: 'POST', body: fd });
      const data = await res.json();
      showFlash(data.mensaje ?? (res.ok ? 'Imagen actualizada.' : 'Error al subir.'));
      if (res.ok) await cargarTodo();
    } catch { showFlash('Error de conexión.'); }
    finally { setLoading(false); }
  };

  // ── Guardar nombre de marca ─────────────────────────────────────────────────
  const guardarNombreMarca = async () => {
    setLoading(true);
    try {
      const res  = await apiFetch('/api/admin/configuracion', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre_marca: config.nombre_marca }),
      });
      const data = await res.json();
      showFlash(data.mensaje ?? 'Guardado.');
    } catch { showFlash('Error de conexión.'); }
    finally { setLoading(false); }
  };

  // ── Nuevo trabajo ───────────────────────────────────────────────────────────
  const refNuevo = useRef<HTMLFormElement>(null);
  const handleNuevoTrabajo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await postForm('nuevo-trabajo', new FormData(e.currentTarget));
    refNuevo.current?.reset();
    setSeccionAbierta(null);
  };

  // ── Agregar fotos ───────────────────────────────────────────────────────────
  const refAgregarFotos = useRef<HTMLFormElement>(null);
  const handleAgregarFotos = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await postForm('agregar-fotos', new FormData(e.currentTarget));
    refAgregarFotos.current?.reset();
    setAgregarEnTrabajo(null);
  };

  // ── Editar trabajo ──────────────────────────────────────────────────────────
  const handleEditarTrabajo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editando) return;
    const fd = new FormData();
    fd.append('categoria',          editando.cat);
    fd.append('trabajo',            editando.slug);
    fd.append('descripcion',        editando.desc);
    fd.append('descripcion_evento', editando.descEvento);
    await postForm('editar-trabajo', fd);
    setEditando(null);
  };

  // ── Eliminar trabajo / foto ─────────────────────────────────────────────────
  const eliminarTrabajo = async (cat: string, slug: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}" y TODAS sus fotos? Esta acción no se puede deshacer.`)) return;
    const fd = new FormData();
    fd.append('categoria', cat);
    fd.append('trabajo',   slug);
    await postForm('eliminar-trabajo', fd);
  };

  const eliminarFoto = async (cat: string, slug: string, foto: string) => {
    if (!confirm(`¿Eliminar la foto "${foto}"?`)) return;
    const fd = new FormData();
    fd.append('categoria', cat);
    fd.append('trabajo',   slug);
    fd.append('foto',      foto);
    await postForm('eliminar-foto', fd);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // LOGIN
  // ══════════════════════════════════════════════════════════════════════════
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50 px-4">
        <form onSubmit={handleLogin} className="bg-white w-full max-w-md rounded-3xl shadow-xl p-10 border border-pink-100">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">📷</div>
            <h1 className="font-playfair text-2xl text-gray-900">Panel Admin</h1>
            <p className="text-gray-400 text-xs mt-1 tracking-widest uppercase">Melina Diaz Fotografía</p>
          </div>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-center text-base focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all mb-3"
          />
          {loginError && <p className="text-red-500 text-xs text-center font-bold mb-3">{loginError}</p>}
          <button type="submit" className="w-full py-4 bg-pink-700 text-white rounded-2xl font-bold hover:bg-pink-900 transition-colors shadow-lg shadow-pink-700/20">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PANEL
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {/* Flash */}
        {flash && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 text-white px-8 py-3 rounded-full text-sm font-bold shadow-2xl animate-fade-up whitespace-nowrap">
            {flash}
          </div>
        )}

        {/* Loader */}
        {loading && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[150] flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="font-playfair text-4xl text-gray-900">Panel Admin</h1>
            <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">Cloudflare Worker + D1 + R2</p>
          </div>
          <button onClick={logout} className="text-xs font-bold text-red-400 border border-red-100 px-4 py-2 rounded-full hover:bg-red-50 transition-colors uppercase tracking-wide">
            Salir
          </button>
        </div>

        {/* ── SECCIÓN: IDENTIDAD VISUAL ───────────────────────────────────── */}
        <section className="bg-white rounded-3xl border border-pink-100 shadow-sm p-6 sm:p-8 mb-6">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setSeccionAbierta(s => s === 'config' ? null : 'config')}
          >
            <h2 className="font-playfair text-xl text-gray-900">🎨 Identidad Visual</h2>
            <span className="text-gray-400 text-lg">{seccionAbierta === 'config' ? '−' : '+'}</span>
          </button>

          {seccionAbierta === 'config' && (
            <div className="mt-6 border-t border-gray-50 pt-6 space-y-8">

              {/* Logo */}
              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl border-2 border-dashed border-pink-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {config.logo_url
                        ? <img src={config.logo_url} className="w-full h-full object-contain p-2" alt="logo" />
                        : <span className="text-[10px] text-gray-300 text-center">Sin logo</span>
                      }
                    </div>
                    <div>
                      <input
                        type="file" accept="image/*"
                        onChange={e => { const f = e.target.files?.[0]; if (f) subirImagen('configuracion/logo', f); }}
                        className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-pink-50 file:text-pink-700 file:font-semibold hover:file:bg-pink-100 cursor-pointer"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, SVG o WEBP · Reemplaza favicon también</p>
                    </div>
                  </div>
                </div>

                {/* Nombre de marca */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Nombre del estudio</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.nombre_marca}
                      onChange={e => setConfig(c => ({ ...c, nombre_marca: e.target.value }))}
                      className="flex-1 bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100"
                      placeholder="Ej: Melina Diaz Fotografía"
                    />
                    <button onClick={guardarNombreMarca} className="bg-gray-900 text-white px-5 py-3 rounded-2xl text-xs font-bold hover:bg-black transition-colors whitespace-nowrap">
                      Guardar
                    </button>
                  </div>
                </div>
              </div>

              {/* ── IMAGEN DE HERO ─────────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Imagen del Hero (inicio)
                </label>
                <div className="flex items-start gap-5">
                  {/* Preview */}
                  <div className="w-40 h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-pink-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {config.hero_url
                      ? <img src={config.hero_url} className="w-full h-full object-cover" alt="hero" />
                      : <span className="text-[10px] text-gray-300 text-center px-2">Sin imagen<br/>(usa gradiente)</span>
                    }
                  </div>
                  <div className="flex-1">
                    <input
                      type="file" accept="image/*"
                      onChange={e => { const f = e.target.files?.[0]; if (f) subirImagen('configuracion/hero', f); }}
                      className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-pink-50 file:text-pink-700 file:font-semibold hover:file:bg-pink-100 cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                      Se muestra como fondo de la sección principal del inicio.<br />
                      Recomendado: 1920×1080px o más. JPG o WEBP.
                    </p>
                    {config.hero_url && (
                      <button
                        onClick={async () => {
                          setLoading(true);
                          const res  = await apiFetch('/api/admin/configuracion', {
                            method:  'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body:    JSON.stringify({ hero_url: '' }),
                          });
                          const data = await res.json();
                          showFlash(data.mensaje ?? 'Hero eliminado.');
                          if (res.ok) { setConfig(c => ({ ...c, hero_url: '' })); }
                          setLoading(false);
                        }}
                        className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors font-bold"
                      >
                        Eliminar imagen → volver al gradiente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── SECCIÓN: NUEVA SESIÓN ──────────────────────────────────────────── */}
        <section className="bg-white rounded-3xl border border-pink-100 shadow-sm p-6 sm:p-8 mb-6">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setSeccionAbierta(s => s === 'nuevo' ? null : 'nuevo')}
          >
            <h2 className="font-playfair text-xl text-gray-900">📁 Nueva sesión fotográfica</h2>
            <span className="text-gray-400 text-lg">{seccionAbierta === 'nuevo' ? '−' : '+'}</span>
          </button>

          {seccionAbierta === 'nuevo' && (
            <form ref={refNuevo} onSubmit={handleNuevoTrabajo} className="mt-6 border-t border-gray-50 pt-6">
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre *</label>
                  <input name="nombre" required placeholder="Ej: José y María"
                    className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Categoría *</label>
                  <select name="categoria" required
                    className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100">
                    {categorias.map(c => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descripción SEO</label>
                  <input name="descripcion" placeholder="Para buscadores"
                    className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descripción visible</label>
                  <input name="descripcion_evento" placeholder="Aparece en la galería"
                    className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100" />
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Fotos</label>
                <input name="fotos" type="file" accept="image/*" multiple
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-5 file:rounded-full file:border-0 file:bg-pink-50 file:text-pink-700 file:font-semibold hover:file:bg-pink-100 cursor-pointer" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="bg-pink-700 text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-pink-900 transition-colors">
                  Crear sesión
                </button>
                <button type="button" onClick={() => setSeccionAbierta(null)} className="text-gray-400 text-sm hover:text-gray-600 px-4">
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </section>

        {/* ── GALERÍAS ──────────────────────────────────────────────────────── */}
        <h2 className="font-playfair text-2xl text-gray-900 mb-6">Galerías y portadas</h2>

        {categorias.map(cat => (
          <section key={cat.slug} className="bg-white rounded-3xl border border-gray-100 shadow-sm mb-6 overflow-hidden">

            {/* Header categoría */}
            <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-pink-50/50 to-white border-b border-gray-50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Portada actual + botón para cambiarla */}
                  <div className="relative group w-16 h-16 flex-shrink-0">
                    <img
                      src={`${R2}/${cat.portada}`}
                      alt={cat.nombre}
                      className="w-full h-full object-cover rounded-xl border border-gray-100"
                    />
                    {/* Overlay "Cambiar" */}
                    <label className="absolute inset-0 bg-black/50 text-white text-[9px] font-bold uppercase tracking-wide flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      Cambiar
                      <input
                        type="file" accept="image/*" className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) subirImagen('categorias/portada', f, { slug: cat.slug });
                        }}
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{cat.nombre}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Portada: <span className="font-mono">{cat.portada}</span>
                      <span className="ml-2 text-pink-500">· Hover sobre la imagen para cambiarla</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-bold">
                  {(trabajos[cat.slug] ?? []).length} sesiones
                </span>
              </div>
            </div>

            {/* Trabajos */}
            <div className="p-6 sm:p-8">
              {(trabajos[cat.slug] ?? []).length === 0 ? (
                <p className="text-gray-300 text-sm italic text-center py-4">No hay sesiones en esta categoría aún.</p>
              ) : (
                <div className="space-y-5">
                  {(trabajos[cat.slug] ?? []).map(t => (
                    <div key={t.slug} className="border border-gray-100 rounded-2xl p-5 hover:border-pink-100 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div>
                          <span className="font-bold text-gray-800">{t.nombre}</span>
                          <span className="text-gray-400 text-xs ml-2">({t.año})</span>
                          <span className="text-gray-300 text-xs ml-3">{t.fotos.length} fotos</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => setAgregarEnTrabajo({ cat: cat.slug, slug: t.slug })}
                            className="text-xs font-bold text-pink-600 border border-pink-100 px-3 py-1.5 rounded-full hover:bg-pink-50 transition-colors">
                            + Fotos
                          </button>
                          <button onClick={() => setEditando({ cat: cat.slug, slug: t.slug, desc: t.descripcion ?? '', descEvento: t.descripcion_evento ?? '' })}
                            className="text-xs font-bold text-gray-500 border border-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors">
                            Editar
                          </button>
                          <button onClick={() => eliminarTrabajo(cat.slug, t.slug, t.nombre)}
                            className="text-xs font-bold text-red-400 border border-red-50 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors">
                            Eliminar
                          </button>
                        </div>
                      </div>

                      {t.fotos.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {t.fotos.map(foto => (
                            <div key={foto} className="relative group w-20 h-20 flex-shrink-0">
                              <img
                                src={`${R2}/${cat.slug}/${t.slug}/${foto}`}
                                alt={foto}
                                className="w-full h-full object-cover rounded-xl border border-gray-100"
                              />
                              <button onClick={() => eliminarFoto(cat.slug, t.slug, foto)}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md">
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}

        {/* ── MODAL: AGREGAR FOTOS ─────────────────────────────────────────── */}
        {agregarEnTrabajo && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
              <h3 className="font-playfair text-xl text-gray-900 mb-1">Agregar fotos</h3>
              <p className="text-gray-400 text-xs mb-6 uppercase tracking-widest">
                {agregarEnTrabajo.cat} / {agregarEnTrabajo.slug}
              </p>
              <form ref={refAgregarFotos} onSubmit={handleAgregarFotos}>
                <input type="hidden" name="categoria" value={agregarEnTrabajo.cat} />
                <input type="hidden" name="trabajo"   value={agregarEnTrabajo.slug} />
                <div className="mb-6">
                  <input name="fotos" type="file" accept="image/*" multiple required
                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-5 file:rounded-full file:border-0 file:bg-pink-50 file:text-pink-700 file:font-semibold hover:file:bg-pink-100 cursor-pointer" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-pink-700 text-white py-3 rounded-2xl text-sm font-bold hover:bg-pink-900 transition-colors">
                    Subir fotos
                  </button>
                  <button type="button" onClick={() => setAgregarEnTrabajo(null)}
                    className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── MODAL: EDITAR TRABAJO ────────────────────────────────────────── */}
        {editando && (
          <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
              <h3 className="font-playfair text-xl text-gray-900 mb-1">Editar sesión</h3>
              <p className="text-gray-400 text-xs mb-6 uppercase tracking-widest">
                {editando.cat} / {editando.slug}
              </p>
              <form onSubmit={handleEditarTrabajo}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descripción SEO</label>
                    <input type="text" value={editando.desc}
                      onChange={e => setEditando(v => v ? { ...v, desc: e.target.value } : v)}
                      className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100"
                      placeholder="Descripción para buscadores" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Descripción visible</label>
                    <input type="text" value={editando.descEvento}
                      onChange={e => setEditando(v => v ? { ...v, descEvento: e.target.value } : v)}
                      className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100"
                      placeholder="Descripción en la galería" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 bg-pink-700 text-white py-3 rounded-2xl text-sm font-bold hover:bg-pink-900 transition-colors">
                    Guardar
                  </button>
                  <button type="button" onClick={() => setEditando(null)}
                    className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
