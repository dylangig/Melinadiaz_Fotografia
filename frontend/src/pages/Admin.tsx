// pages/Admin.tsx — Plantilla completa v2
// Secciones: Identidad, Hero, Contacto/Footer, Testimonios, Categorías, Sesiones
import { useState, useEffect, useRef, useCallback } from 'react';
import { adminLogin, adminCheck, getAdminToken, setAdminToken } from '../hooks/useApi';
import type { Categoria, TrabajosData } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';
const R2       = 'https://imagenes.melinadiazfotografia.com.ar';

const getTexto = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const normalizarUrlImagen = (value: unknown): string => {
  const raw = getTexto(value).trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? `${R2}${raw}` : `${R2}/${raw}`;
};

const conCacheBuster = (url: string, version: number): string =>
  `${url}${url.includes('?') ? '&' : '?'}v=${version}`;

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getAdminToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string> ?? {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return fetch(`${API_BASE}${path}`, { ...options, headers });
}

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Config {
  nombre_marca: string; logo_url: string; favicon_url: string; tagline: string;
  hero_url: string; hero_titulo: string; hero_subtitulo: string; hero_boton_texto: string;
  whatsapp: string; email: string; zona: string;
  footer_texto: string; seo_descripcion: string;
}
interface Testimonio { id?: number; texto: string; autora: string; tipo: string; orden: number; }
interface CatExtended extends Categoria { portada: string; }

const CONFIG_VACIA: Config = {
  nombre_marca: '', logo_url: '', favicon_url: '', tagline: '',
  hero_url: '', hero_titulo: '', hero_subtitulo: '', hero_boton_texto: '',
  whatsapp: '', email: '', zona: '', footer_texto: '', seo_descripcion: '',
};

// ── Componente Tab ─────────────────────────────────────────────────────────────
function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${
        active ? 'border-pink-600 text-pink-600' : 'border-transparent text-gray-400 hover:text-gray-600'
      }`}
    >
      {label}
    </button>
  );
}

// ── Input helper ───────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, textarea }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; textarea?: boolean;
}) {
  const cls = "w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100 transition-all";
  return (
    <div>
      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} className={cls + ' resize-none'} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      }
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Admin() {
  const [authed,      setAuthed]      = useState(false);
  const [password,    setPassword]    = useState('');
  const [loginError,  setLoginError]  = useState('');
  const [flash,       setFlash]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [tab,         setTab]         = useState('identidad');

  // Datos
  const [config,      setConfig]      = useState<Config>(CONFIG_VACIA);
  const [heroPreviewVersion, setHeroPreviewVersion] = useState<number>(() => Date.now());
  const [categorias,  setCategorias]  = useState<CatExtended[]>([]);
  const [trabajos,    setTrabajos]    = useState<TrabajosData>({});
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);

  // Modales
  const [modalFotos,    setModalFotos]    = useState<{ cat: string; slug: string } | null>(null);
  const [modalEditar,   setModalEditar]   = useState<{ cat: string; slug: string; desc: string; descEvento: string } | null>(null);
  const [modalTestim,   setModalTestim]   = useState<Testimonio | null>(null);
  const [modalNuevaCat, setModalNuevaCat] = useState(false);
  const [modalNuevaSes, setModalNuevaSes] = useState(false);

  // Drag & drop fotos
  const [dragging,    setDragging]    = useState<{ cat: string; slug: string; foto: string } | null>(null);
  const [dragOver,    setDragOver]    = useState<string | null>(null);

  useEffect(() => {
    adminCheck().then(ok => { if (ok) { setAuthed(true); cargarTodo(); } });
  }, []);

  useEffect(() => {
    if (config.hero_url) setHeroPreviewVersion(Date.now());
  }, [config.hero_url]);

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [catRes, trabRes, confRes, testimRes] = await Promise.all([
        apiFetch('/api/categorias'),
        apiFetch('/api/admin/trabajos-todos'),
        apiFetch('/api/configuracion'),
        apiFetch('/api/admin/testimonios'),
      ]);
      if (catRes.ok)    setCategorias(await catRes.json());
      if (trabRes.ok)   setTrabajos(await trabRes.json());
      if (confRes.ok) {
      const data = (await confRes.json()) ?? {};
      setConfig({
        nombre_marca:     data.nombre_marca     || 'Melina Diaz Fotografía',
        logo_url:         normalizarUrlImagen(data.logo_url),
        favicon_url:      normalizarUrlImagen(data.favicon_url),
        tagline:          data.tagline          || 'Fotografía Profesional · Zona Sur Buenos Aires',
        hero_url:         normalizarUrlImagen(data.hero_url),
        hero_titulo:      getTexto(data.hero_titulo, 'Capturando momentos que duran toda la vida'),
        hero_subtitulo:   getTexto(data.hero_subtitulo, 'Books infantiles, quinceañeras y bodas en Almirante Brown, Lomas de Zamora, Quilmes y toda la Zona Sur.'),
        hero_boton_texto: getTexto(data.hero_boton_texto, 'Reservar sesión'),
        whatsapp:         data.whatsapp         || '5491176348089',
        email:            data.email            || '',
        zona:             data.zona             || 'Zona Sur, Buenos Aires',
        footer_texto:     data.footer_texto     || 'Capturando momentos únicos con sensibilidad y pasión.',
        seo_descripcion:  data.seo_descripcion  || 'Fotografía profesional en Zona Sur Buenos Aires.',
      });
    }
      if (testimRes.ok) setTestimonios(await testimRes.json());
    } catch { showFlash('Error al conectar con el Worker'); }
    finally  { setLoading(false); }
  };

  const showFlash = (msg: string) => { setFlash(msg); setTimeout(() => setFlash(''), 3500); };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await adminLogin(password);
    if (ok) { setAuthed(true); cargarTodo(); }
    else setLoginError('Contraseña incorrecta');
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
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

  const postJson = async (endpoint: string, body: object) => {
    setLoading(true);
    try {
      const res  = await apiFetch(`/api/admin/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      showFlash(data.mensaje ?? (res.ok ? 'Guardado.' : 'Error.'));
      if (res.ok) await cargarTodo();
    } catch { showFlash('Error de conexión'); }
    finally { setLoading(false); }
  };
  
  const subirImagen = async (endpoint: string, file: File, extra?: Record<string, string>) => {
    const fd = new FormData();
    fd.append('file', file);
    if (extra) Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
    setLoading(true);
    try {
      const res  = await apiFetch(`/api/admin/${endpoint}`, { method: 'POST', body: fd });
      const data = await res.json();
      showFlash(data.mensaje ?? (res.ok ? 'Imagen subida.' : 'Error.'));
      if (res.ok) await cargarTodo();
    } catch { showFlash('Error de conexión.'); }
    finally { setLoading(false); }
  };

  // ── Guardar config ─────────────────────────────────────────────────────────
  const limpiarCampos = (obj: any) => {
  const limpio: any = {};

  Object.keys(obj).forEach((k) => {
    const val = obj[k];
    if (val !== undefined && val !== null) {
      limpio[k] = val;
    }
  });

  return limpio;
};

const guardarConfig = (campos: Partial<Config>) => {
  console.log("CAMBIOS RECIBIDOS:", campos);

  const body = limpiarCampos(campos);
  console.log("BODY LIMPIO:", body);

  if (Object.keys(body).length === 0) {
    console.log("⚠️ BODY VACÍO");
    showFlash('No hay cambios para guardar.');
    return Promise.resolve();
  }

  console.log("ENVIANDO AL BACKEND:", body);
  return postJson('configuracion', body);
};

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const eliminarTrabajo = async (cat: string, slug: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}" y TODAS sus fotos?`)) return;
    const fd = new FormData();
    fd.append('categoria', cat); fd.append('trabajo', slug);
    await postForm('eliminar-trabajo', fd);
  };

  const eliminarFoto = async (cat: string, slug: string, foto: string) => {
    if (!confirm(`¿Eliminar "${foto}"?`)) return;
    const fd = new FormData();
    fd.append('categoria', cat); fd.append('trabajo', slug); fd.append('foto', foto);
    await postForm('eliminar-foto', fd);
  };

  // ── Drag & drop reordenar fotos ────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, cat: string, slug: string, foto: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', foto);
    setDragging({ cat, slug, foto });
  };

  const handleDrop = useCallback(async (cat: string, slug: string, fotoDestino: string) => {
    if (!dragging || dragging.foto === fotoDestino) { setDragging(null); setDragOver(null); return; }
    const fotos = trabajos[cat]?.find(t => t.slug === slug)?.fotos ?? [];
    const idxA  = fotos.indexOf(dragging.foto);
    const idxB  = fotos.indexOf(fotoDestino);
    if (idxA === -1 || idxB === -1) return;
    const nuevo = [...fotos];
    nuevo.splice(idxA, 1);
    nuevo.splice(idxB, 0, dragging.foto);
    setDragging(null); setDragOver(null);
    await postJson('reordenar-fotos', { categoria: cat, trabajo: slug, orden: nuevo });
  }, [dragging, trabajos]);

  // ── Testimonios ────────────────────────────────────────────────────────────
  const guardarTestimonio = async (t: Testimonio) => {
    const endpoint = t.id ? 'testimonios/editar' : 'testimonios/nuevo';
    await postJson(endpoint, t);
    setModalTestim(null);
  };

  const eliminarTestimonio = async (id: number) => {
    if (!confirm('¿Eliminar este testimonio?')) return;
    await postJson('testimonios/eliminar', { id });
  };

  // ── Refs formularios ───────────────────────────────────────────────────────
  const refNuevaSes  = useRef<HTMLFormElement>(null);
  const refNuevaCat  = useRef<HTMLFormElement>(null);
  const refAddFotos  = useRef<HTMLFormElement>(null);
  const heroPreviewUrl = config.hero_url
    ? conCacheBuster(normalizarUrlImagen(config.hero_url), heroPreviewVersion)
    : '';

  // ══════════════════════════════════════════════════════════════════════════
  // LOGIN
  // ══════════════════════════════════════════════════════════════════════════
  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50 px-4">
      <form onSubmit={handleLogin} className="bg-white w-full max-w-md rounded-3xl shadow-xl p-10 border border-pink-100">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📷</div>
          <h1 className="font-playfair text-2xl text-gray-900">Panel Admin</h1>
          <p className="text-gray-400 text-xs mt-1 tracking-widest uppercase">Melina Diaz Fotografía</p>
        </div>
        <input type="password" placeholder="Contraseña" value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-center text-base focus:outline-none focus:ring-2 focus:ring-pink-200 mb-3" />
        {loginError && <p className="text-red-500 text-xs text-center font-bold mb-3">{loginError}</p>}
        <button type="submit" className="w-full py-4 bg-pink-700 text-white rounded-2xl font-bold hover:bg-pink-900 transition-colors">
          Entrar
        </button>
      </form>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // PANEL PRINCIPAL
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">

        {/* Flash */}
        {flash && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-gray-900 text-white px-8 py-3 rounded-full text-sm font-bold shadow-2xl animate-fade-up whitespace-nowrap">
            {flash}
          </div>
        )}
        {loading && (
          <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[150] flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin" />
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="font-playfair text-4xl text-gray-900">Panel Admin</h1>
            <p className="text-gray-400 text-xs uppercase tracking-widest mt-1">Plantilla Fotográfica</p>
          </div>
          <button onClick={() => { setAdminToken(null); setAuthed(false); }}
            className="text-xs font-bold text-red-400 border border-red-100 px-4 py-2 rounded-full hover:bg-red-50 transition-colors">
            Salir
          </button>
        </div>

        {/* Tabs de navegación */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8 overflow-x-auto">
          <div className="flex border-b border-gray-100 px-4">
            {[
              { key: 'identidad', label: '🎨 Identidad' },
              { key: 'hero',      label: '🖼 Hero'       },
              { key: 'contacto',  label: '📱 Contacto'  },
              { key: 'testimonios',label:'⭐ Testimonios'},
              { key: 'categorias',label: '📂 Categorías'},
              { key: 'sesiones',  label: '📸 Sesiones'  },
            ].map(t => (
              <Tab key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />
            ))}
          </div>

          <div className="p-6 sm:p-8">

            {/* ── TAB: IDENTIDAD ──────────────────────────────────────────── */}
            {tab === 'identidad' && (
              <div className="space-y-6">
                <h2 className="font-playfair text-xl text-gray-900 mb-4">Identidad Visual</h2>

                {/* Logo */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Logo</label>
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-20 bg-gray-50 rounded-2xl border-2 border-dashed border-pink-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {config.logo_url
                        ? <img src={config.logo_url} className="w-full h-full object-contain p-2" alt="logo" />
                        : <span className="text-[10px] text-gray-300">Sin logo</span>}
                    </div>
                    <div>
                      <input type="file" accept="image/*"
                        onChange={e => { const f = e.target.files?.[0]; if (f) subirImagen('configuracion/logo', f); }}
                        className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-pink-50 file:text-pink-700 file:font-semibold hover:file:bg-pink-100 cursor-pointer" />
                      <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, SVG o WEBP · Logo del sitio</p>
                    </div>
                  </div>
                </div>

                <Field label="Favicon URL (independiente del logo)" value={config.favicon_url}
                  onChange={v => setConfig(c => ({ ...c, favicon_url: v }))}
                  placeholder="https://.../favicon.ico o .png" />

                <Field label="Nombre del estudio" value={config.nombre_marca}
                  onChange={v => setConfig(c => ({ ...c, nombre_marca: v }))}
                  placeholder="Ej: Melina Diaz Fotografía" />

                <Field label="Tagline (texto debajo del logo o en el header)" value={config.tagline}
                  onChange={v => setConfig(c => ({ ...c, tagline: v }))}
                  placeholder="Ej: Fotografía Profesional · Zona Sur Buenos Aires" />

                <Field label="Descripción SEO (meta description)" value={config.seo_descripcion}
                  onChange={v => setConfig(c => ({ ...c, seo_descripcion: v }))}
                  placeholder="Descripción que aparece en Google" textarea />

                <button onClick={() => guardarConfig({
                  nombre_marca: config.nombre_marca,
                  favicon_url: config.favicon_url,
                  tagline: config.tagline,
                  seo_descripcion: config.seo_descripcion,
                })} className="bg-pink-700 text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-pink-900 transition-colors">
                  Guardar identidad
                </button>
              </div>
            )}

            {/* ── TAB: HERO ────────────────────────────────────────────────── */}
            {tab === 'hero' && (
              <div className="space-y-6">
                <h2 className="font-playfair text-xl text-gray-900 mb-4">Sección Hero (inicio)</h2>

                {/* Imagen de fondo */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Imagen de fondo</label>
                  <div className="flex items-start gap-5">
                    <div className="w-40 h-24 bg-gray-50 rounded-2xl border-2 border-dashed border-pink-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {config.hero_url
                        ? <img src={heroPreviewUrl} className="w-full h-full object-cover" alt="hero" />
                        : <span className="text-[10px] text-gray-300 text-center px-2">Sin imagen<br/>(gradiente)</span>}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input type="file" accept="image/*"
                        onChange={e => { const f = e.target.files?.[0]; if (f) subirImagen('configuracion/hero', f); }}
                        className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-pink-50 file:text-pink-700 file:font-semibold hover:file:bg-pink-100 cursor-pointer" />
                      <p className="text-[10px] text-gray-400">Recomendado: 1920×1080px. JPG o WEBP.</p>
                      {config.hero_url && (
                        <button onClick={() => guardarConfig({ hero_url: '' })}
                          className="text-xs text-red-400 hover:text-red-600 font-bold">
                          Eliminar → volver al gradiente
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <Field label="Título principal" value={config.hero_titulo}
                  onChange={v => setConfig(c => ({ ...c, hero_titulo: v }))}
                  placeholder="Capturando momentos que duran toda la vida" />

                <Field label="Subtítulo / descripción" value={config.hero_subtitulo}
                  onChange={v => setConfig(c => ({ ...c, hero_subtitulo: v }))}
                  placeholder="Books infantiles, quinceañeras y bodas..." textarea />

                <Field label="Texto del botón principal" value={config.hero_boton_texto}
                  onChange={v => setConfig(c => ({ ...c, hero_boton_texto: v }))}
                  placeholder="Reservar sesión" />

                <button onClick={() => guardarConfig({
                  hero_titulo: config.hero_titulo,
                  hero_subtitulo: config.hero_subtitulo,
                  hero_boton_texto: config.hero_boton_texto,
                })} className="bg-pink-700 text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-pink-900 transition-colors">
                  Guardar textos del hero
                </button>
              </div>
            )}

            {/* ── TAB: CONTACTO ────────────────────────────────────────────── */}
            {tab === 'contacto' && (
              <div className="space-y-6">
                <h2 className="font-playfair text-xl text-gray-900 mb-4">Contacto y Footer</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="WhatsApp (solo números, con código país)"
                    value={config.whatsapp} onChange={v => setConfig(c => ({ ...c, whatsapp: v }))}
                    placeholder="5491176348089" />
                  <Field label="Email (opcional)"
                    value={config.email} onChange={v => setConfig(c => ({ ...c, email: v }))}
                    placeholder="hola@tucorreo.com" />
                </div>

                <Field label="Zona geográfica (aparece en footer y formulario)"
                  value={config.zona} onChange={v => setConfig(c => ({ ...c, zona: v }))}
                  placeholder="Zona Sur, Buenos Aires" />

                <Field label="Texto del footer"
                  value={config.footer_texto} onChange={v => setConfig(c => ({ ...c, footer_texto: v }))}
                  placeholder="Capturando momentos únicos con sensibilidad y pasión." textarea />

                <button onClick={() => guardarConfig({
                  whatsapp: config.whatsapp,
                  email: config.email,
                  zona: config.zona,
                  footer_texto: config.footer_texto,
                })} className="bg-pink-700 text-white px-8 py-3 rounded-2xl text-sm font-bold hover:bg-pink-900 transition-colors">
                  Guardar contacto y footer
                </button>
              </div>
            )}

            {/* ── TAB: TESTIMONIOS ─────────────────────────────────────────── */}
            {tab === 'testimonios' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-playfair text-xl text-gray-900">Testimonios</h2>
                  <button
                    onClick={() => setModalTestim({ texto: '', autora: '', tipo: '', orden: testimonios.length + 1 })}
                    className="bg-pink-700 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-pink-900 transition-colors"
                  >
                    + Agregar testimonio
                  </button>
                </div>

                {testimonios.length === 0 ? (
                  <p className="text-gray-300 text-sm italic text-center py-8">No hay testimonios todavía.</p>
                ) : (
                  <div className="space-y-4">
                    {testimonios.map((t, i) => (
                      <div key={i} className="border border-gray-100 rounded-2xl p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-gray-600 italic text-sm mb-2">"{t.texto}"</p>
                            <div className="flex gap-3 text-xs">
                              <span className="font-bold text-pink-700 uppercase tracking-widest">{t.autora}</span>
                              <span className="text-gray-400">— {t.tipo}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => setModalTestim(t)}
                              className="text-xs font-bold text-gray-400 border border-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-50">
                              Editar
                            </button>
                            <button onClick={() => t.id && eliminarTestimonio(t.id)}
                              className="text-xs font-bold text-red-400 border border-red-50 px-3 py-1.5 rounded-full hover:bg-red-50">
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: CATEGORÍAS ──────────────────────────────────────────── */}
            {tab === 'categorias' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-playfair text-xl text-gray-900">Categorías de galería</h2>
                  <button onClick={() => setModalNuevaCat(true)}
                    className="bg-pink-700 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-pink-900 transition-colors">
                    + Nueva categoría
                  </button>
                </div>

                <div className="space-y-4">
                  {categorias.map(cat => (
                    <div key={cat.slug} className="border border-gray-100 rounded-2xl p-5">
                      <div className="flex items-center gap-4">
                        {/* Portada con hover para cambiar */}
                        <div className="relative group w-16 h-16 flex-shrink-0">
                          <img src={`${R2}/${cat.portada}`} alt={cat.nombre}
                            className="w-full h-full object-cover rounded-xl border border-gray-100" />
                          <label className="absolute inset-0 bg-black/50 text-white text-[9px] font-bold uppercase flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            Cambiar
                            <input type="file" accept="image/*" className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (f) subirImagen('categorias/portada', f, { slug: cat.slug }); }} />
                          </label>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{cat.nombre}</p>
                          <p className="text-xs text-gray-400 font-mono">/galeria/{cat.slug}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const nuevoNombre = prompt('Nuevo nombre para la categoría:', cat.nombre);
                              if (nuevoNombre && nuevoNombre !== cat.nombre) {
                                postJson('categorias/renombrar', { slug: cat.slug, nombre: nuevoNombre.trim() });
                              }
                            }}
                            className="text-xs font-bold text-gray-400 border border-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-50">
                            Renombrar
                          </button>
                          <button
                            onClick={() => {
                              if (!confirm(`¿Eliminar la categoría "${cat.nombre}" y TODAS sus sesiones? Esta acción no se puede deshacer.`)) return;
                              postJson('categorias/eliminar', { slug: cat.slug });
                            }}
                            className="text-xs font-bold text-red-400 border border-red-50 px-3 py-1.5 rounded-full hover:bg-red-50">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── TAB: SESIONES ────────────────────────────────────────────── */}
            {tab === 'sesiones' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-playfair text-xl text-gray-900">Sesiones fotográficas</h2>
                  <button onClick={() => setModalNuevaSes(true)}
                    className="bg-pink-700 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-pink-900 transition-colors">
                    + Nueva sesión
                  </button>
                </div>

                {categorias.map(cat => (
                  <div key={cat.slug} className="mb-8">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-4">
                      {cat.nombre}
                    </h3>

                    {(trabajos[cat.slug] ?? []).length === 0 ? (
                      <p className="text-gray-300 text-sm italic py-3">Sin sesiones en esta categoría.</p>
                    ) : (
                      <div className="space-y-4">
                        {(trabajos[cat.slug] ?? []).map(t => (
                          <div key={t.slug} className="border border-gray-100 rounded-2xl p-5 hover:border-pink-100 transition-colors">
                            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                              <div>
                                <span className="font-bold text-gray-800">{t.nombre}</span>
                                <span className="text-gray-400 text-xs ml-2">({t.año})</span>
                                <span className="text-gray-300 text-xs ml-2">{t.fotos.length} fotos</span>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                <button onClick={() => setModalFotos({ cat: cat.slug, slug: t.slug })}
                                  className="text-xs font-bold text-pink-600 border border-pink-100 px-3 py-1.5 rounded-full hover:bg-pink-50">
                                  + Fotos
                                </button>
                                <button onClick={() => setModalEditar({ cat: cat.slug, slug: t.slug, desc: t.descripcion ?? '', descEvento: t.descripcion_evento ?? '' })}
                                  className="text-xs font-bold text-gray-500 border border-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-50">
                                  Editar
                                </button>
                                <button onClick={() => eliminarTrabajo(cat.slug, t.slug, t.nombre)}
                                  className="text-xs font-bold text-red-400 border border-red-50 px-3 py-1.5 rounded-full hover:bg-red-50">
                                  Eliminar
                                </button>
                              </div>
                            </div>

                            {/* Fotos con drag & drop */}
                            {t.fotos.length > 0 && (
                              <>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-3">
                                  Arrastra para reordenar - solta sobre la posicion deseada
                                </p>
                                <div
                                  onDragLeave={e => {
                                    const next = e.relatedTarget as Node | null;
                                    if (!next || !e.currentTarget.contains(next)) setDragOver(null);
                                  }}
                                  className={`flex flex-wrap gap-3 rounded-2xl border border-dashed p-3 transition-colors duration-200 ${
                                  dragging?.cat === cat.slug && dragging?.slug === t.slug
                                    ? 'border-pink-200 bg-pink-50/70'
                                    : 'border-transparent bg-transparent'
                                }`}
                                >
                                  {t.fotos.map(foto => (
                                    <div key={foto} className="relative w-20 h-20 flex-shrink-0">
                                      {dragOver === foto && dragging?.foto !== foto && (
                                        <div className="pointer-events-none absolute inset-y-1 left-0 z-10 w-1.5 rounded-full bg-pink-400 shadow-[0_0_0_4px_rgba(233,111,154,0.16)]" />
                                      )}
                                      <div
                                        draggable
                                        aria-grabbed={dragging?.foto === foto}
                                        onDragStart={e => handleDragStart(e, cat.slug, t.slug, foto)}
                                        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOver !== foto) setDragOver(foto); }}
                                        onDrop={() => handleDrop(cat.slug, t.slug, foto)}
                                        onDragEnd={() => { setDragging(null); setDragOver(null); }}
                                        className={`relative group h-full w-full cursor-grab rounded-2xl border bg-white p-1 shadow-sm transition-all duration-200 ease-out active:cursor-grabbing hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-[0_12px_24px_rgba(141,26,68,0.12)] focus-within:ring-2 focus-within:ring-pink-200 ${
                                          dragOver === foto ? 'border-pink-300 ring-2 ring-pink-200' : 'border-pink-50'
                                        } ${dragging?.foto === foto ? 'scale-95 opacity-45 shadow-none ring-2 ring-pink-200' : ''}`}
                                      >
                                        <img
                                          src={`${R2}/${cat.slug}/${t.slug}/${foto}`}
                                          alt={foto}
                                          draggable={false}
                                          className="w-full h-full object-cover rounded-xl select-none"
                                        />
                                        <div className="pointer-events-none absolute inset-1 rounded-xl bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                        <button
                                          onClick={() => eliminarFoto(cat.slug, t.slug, foto)}
                                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-6 h-6 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md"
                                        >x</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── MODAL: AGREGAR FOTOS ──────────────────────────────────────────── */}
      {modalFotos && (
        <Modal titulo="Agregar fotos" onClose={() => setModalFotos(null)}>
          <p className="text-gray-400 text-xs mb-5 uppercase tracking-widest">{modalFotos.cat} / {modalFotos.slug}</p>
          <form ref={refAddFotos} onSubmit={e => {
            e.preventDefault();
            postForm('agregar-fotos', new FormData(e.currentTarget));
            refAddFotos.current?.reset();
            setModalFotos(null);
          }}>
            <input type="hidden" name="categoria" value={modalFotos.cat} />
            <input type="hidden" name="trabajo"   value={modalFotos.slug} />
            <input name="fotos" type="file" accept="image/*" multiple required
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-5 file:rounded-full file:border-0 file:bg-pink-50 file:text-pink-700 file:font-semibold hover:file:bg-pink-100 cursor-pointer mb-5 block" />
            <BotonesModal onCancel={() => setModalFotos(null)} labelOk="Subir fotos" />
          </form>
        </Modal>
      )}

      {/* ── MODAL: EDITAR SESIÓN ──────────────────────────────────────────── */}
      {modalEditar && (
        <Modal titulo="Editar sesión" onClose={() => setModalEditar(null)}>
          <form onSubmit={e => {
            e.preventDefault();
            const fd = new FormData();
            fd.append('categoria', modalEditar.cat);
            fd.append('trabajo',   modalEditar.slug);
            fd.append('descripcion', modalEditar.desc);
            fd.append('descripcion_evento', modalEditar.descEvento);
            postForm('editar-trabajo', fd);
            setModalEditar(null);
          }} className="space-y-4">
            <Field label="Descripción SEO" value={modalEditar.desc}
              onChange={v => setModalEditar(m => m ? { ...m, desc: v } : m)} placeholder="Para buscadores" />
            <Field label="Descripción visible" value={modalEditar.descEvento}
              onChange={v => setModalEditar(m => m ? { ...m, descEvento: v } : m)} placeholder="Aparece en la galería" />
            <BotonesModal onCancel={() => setModalEditar(null)} labelOk="Guardar" />
          </form>
        </Modal>
      )}

      {/* ── MODAL: TESTIMONIO ─────────────────────────────────────────────── */}
      {modalTestim && (
        <Modal titulo={modalTestim.id ? 'Editar testimonio' : 'Nuevo testimonio'} onClose={() => setModalTestim(null)}>
          <div className="space-y-4">
            <Field label="Texto del testimonio" value={modalTestim.texto}
              onChange={v => setModalTestim(m => m ? { ...m, texto: v } : m)} textarea
              placeholder="Fue la mejor decisión..." />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nombre / autora" value={modalTestim.autora}
                onChange={v => setModalTestim(m => m ? { ...m, autora: v } : m)} placeholder="Sofía L." />
              <Field label="Tipo de sesión" value={modalTestim.tipo}
                onChange={v => setModalTestim(m => m ? { ...m, tipo: v } : m)} placeholder="15 años" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => modalTestim && guardarTestimonio(modalTestim)}
                className="flex-1 bg-pink-700 text-white py-3 rounded-2xl text-sm font-bold hover:bg-pink-900">
                Guardar
              </button>
              <button onClick={() => setModalTestim(null)}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl text-sm font-bold hover:bg-gray-200">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── MODAL: NUEVA CATEGORÍA ────────────────────────────────────────── */}
      {modalNuevaCat && (
        <Modal titulo="Nueva categoría" onClose={() => setModalNuevaCat(false)}>
          <form ref={refNuevaCat} onSubmit={e => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            postJson('categorias/nueva', {
              nombre: fd.get('nombre') as string,
              slug:   fd.get('slug')   as string,
            });
            refNuevaCat.current?.reset();
            setModalNuevaCat(false);
          }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre visible</label>
              <input name="nombre" required placeholder="Ej: EMBARAZO" className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Slug (URL, solo minúsculas y guiones)</label>
              <input name="slug" required placeholder="Ej: embarazo" pattern="[a-z0-9\-]+"
                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100 font-mono" />
              <p className="text-[10px] text-gray-400 mt-1">Va a quedar en la URL: /galeria/<strong>slug</strong></p>
            </div>
            <BotonesModal onCancel={() => setModalNuevaCat(false)} labelOk="Crear categoría" />
          </form>
        </Modal>
      )}

      {/* ── MODAL: NUEVA SESIÓN ───────────────────────────────────────────── */}
      {modalNuevaSes && (
        <Modal titulo="Nueva sesión fotográfica" onClose={() => setModalNuevaSes(false)}>
          <form ref={refNuevaSes} onSubmit={e => {
            e.preventDefault();
            postForm('nuevo-trabajo', new FormData(e.currentTarget));
            refNuevaSes.current?.reset();
            setModalNuevaSes(false);
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nombre *</label>
                <input name="nombre" required placeholder="Ej: José y María"
                  className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Categoría *</label>
                <select name="categoria" required className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-100">
                  {categorias.map(c => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
                </select>
              </div>
            </div>
            <Field label="Descripción SEO" value="" onChange={() => {}} placeholder="Para buscadores" />
            <Field label="Descripción visible" value="" onChange={() => {}} placeholder="Aparece en la galería" />
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Fotos</label>
              <input name="fotos" type="file" accept="image/*" multiple
                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-pink-50 file:text-pink-700 file:font-semibold hover:file:bg-pink-100 cursor-pointer" />
            </div>
            <BotonesModal onCancel={() => setModalNuevaSes(false)} labelOk="Crear sesión" />
          </form>
        </Modal>
      )}

    </div>
  );
}

// ── Sub-componentes reutilizables ─────────────────────────────────────────────
function Modal({ titulo, children, onClose }: { titulo: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-playfair text-xl text-gray-900">{titulo}</h3>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BotonesModal({ onCancel, labelOk }: { onCancel: () => void; labelOk: string }) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="submit" className="flex-1 bg-pink-700 text-white py-3 rounded-2xl text-sm font-bold hover:bg-pink-900">
        {labelOk}
      </button>
      <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-2xl text-sm font-bold hover:bg-gray-200">
        Cancelar
      </button>
    </div>
  );
}

