import { useState, useEffect } from 'react';
import { adminLogin, adminCheck, getAdminToken } from '../hooks/useApi';
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
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [trabajos, setTrabajos] = useState<TrabajosData>({});
  const [flash, setFlash] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminCheck().then(ok => { 
      if (ok) { 
        setAuthed(true); 
        cargarDatos(); 
      } 
    });
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [catRes, trabRes] = await Promise.all([
        apiFetch('/api/categorias'),
        apiFetch('/api/trabajos')
      ]);
      
      if (catRes.ok) setCategorias(await catRes.json());
      if (trabRes.ok) setTrabajos(await trabRes.json());
    } catch (err) {
      showFlash("Error al conectar con el Worker");
    } finally {
      setLoading(false);
    }
  };

  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(''), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await adminLogin(password);
    if (ok) { 
      setAuthed(true); 
      cargarDatos(); 
    } else {
      setLoginError('Contraseña incorrecta');
    }
  };

  const eliminarFoto = async (catSlug: string, trabSlug: string, fotoNombre: string) => {
    if (!confirm(`¿Eliminar la foto ${fotoNombre}?`)) return;
    
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/trabajos/${catSlug}/${trabSlug}/fotos/${fotoNombre}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showFlash("Foto eliminada correctamente");
        cargarDatos();
      }
    } catch (err) {
      showFlash("Error al eliminar");
    } finally {
      setLoading(false);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-pink-100">
          <h1 className="text-3xl font-playfair mb-6 text-center text-gray-900">Acceso Admin</h1>
          <input
            type="password"
            placeholder="Introduce la contraseña"
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl mb-4 focus:ring-2 focus:ring-pink-200 outline-none transition-all"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {loginError && <p className="text-red-500 text-xs mb-4 text-center font-bold">{loginError}</p>}
          <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg">
            Entrar al Panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        
        {flash && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] bg-gray-900 text-white px-8 py-3 rounded-full text-sm font-bold shadow-2xl animate-fade-up">
            {flash}
          </div>
        )}

        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-playfair text-gray-900">Gestión de Galería</h1>
            <p className="text-gray-400 text-xs uppercase tracking-widest mt-1 font-bold">Cloudflare Worker + D1 Database</p>
          </div>
          <button 
            onClick={() => { localStorage.removeItem('admin_token'); window.location.reload(); }}
            className="px-4 py-2 text-xs font-bold text-red-500 border border-red-100 rounded-full hover:bg-red-50 transition-all"
          >
            SALIR
          </button>
        </header>

        <section className="space-y-8">
          {categorias.map(cat => (
            <div key={cat.slug} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-white to-gray-50 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{cat.nombre}</h2>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                      Slug: {cat.slug}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {trabajos[cat.slug]?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6">
                    {trabajos[cat.slug].map(t => (
                      <div key={t.slug} className="border border-gray-100 rounded-2xl p-5 hover:border-pink-100 transition-colors">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-gray-700">{t.nombre} <span className="text-gray-300 font-normal ml-2">({t.año})</span></h3>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{t.fotos.length} Archivos en R2</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                          {t.fotos.map(foto => (
                            <div key={foto} className="relative group w-24 h-24">
                              <img 
                                src={`https://imagenes.melinadiazfotografia.com.ar/${cat.slug}/${t.slug}/${foto}`} 
                                className="w-full h-full object-cover rounded-xl shadow-inner border border-gray-100"
                                alt={foto}
                              />
                              <button 
                                onClick={() => eliminarFoto(cat.slug, t.slug, foto)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-gray-300 italic text-sm font-montserrat">
                    No hay sesiones cargadas en esta categoría.
                  </p>
                )}
              </div>
            </div>
          ))}
        </section>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold text-pink-600 uppercase tracking-widest">Procesando con Worker...</p>
          </div>
        </div>
      )}
    </div>
  );
}