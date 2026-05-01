import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SobreMi as SobreMiData } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';
const R2 = 'https://imagenes.melinadiazfotografia.com.ar';

const SOBRE_MI_DEFAULT: SobreMiData = {
  titulo: 'Sobre mi',
  texto: [
    'Soy Melina, fotografa especializada en capturar momentos reales con una mirada calida, sensible y atenta a los detalles.',
    'Mi trabajo combina direccion suave, luz natural y una estetica cuidada para que cada sesion se sienta comoda, autentica y personal.',
    'Acompano books infantiles, quince anos, bodas y retratos familiares con la misma intencion: crear imagenes que puedan volver a emocionar con el paso del tiempo.',
  ].join('\n\n'),
  fotoUrl: '/Gemini_Generated_Image_le3nj5le3nj5le3n.png',
  ctaTexto: '',
  ctaDestino: '',
};

const normalizarUrlImagen = (value: string): string => {
  const raw = value.trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  return raw.startsWith('/') ? raw : `${R2}/${raw}`;
};

export default function SobreMi() {
  const [contenido, setContenido] = useState<SobreMiData>(SOBRE_MI_DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/sobre-mi`)
      .then(r => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data: Partial<SobreMiData>) => {
        setContenido({
          titulo: data.titulo || SOBRE_MI_DEFAULT.titulo,
          texto: data.texto || SOBRE_MI_DEFAULT.texto,
          fotoUrl: data.fotoUrl || SOBRE_MI_DEFAULT.fotoUrl,
          ctaTexto: data.ctaTexto || '',
          ctaDestino: data.ctaDestino || '',
        });
      })
      .catch(() => {
        setContenido(SOBRE_MI_DEFAULT);
      })
      .finally(() => setLoading(false));
  }, []);

  const fotoUrl = normalizarUrlImagen(contenido.fotoUrl);
  const parrafos = contenido.texto.split(/\n{2,}/).filter(Boolean);
  const mostrarFoto = Boolean(fotoUrl);

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
      <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-pink-700/70 text-xs tracking-[0.28em] uppercase mb-4">
            Detras de la camara
          </p>
          {loading ? (
            <div className="mb-6 h-12 w-48 rounded-full bg-pink-100/70 animate-pulse sm:h-14 sm:w-64" aria-hidden="true" />
          ) : (
            <h1 className="font-playfair text-4xl sm:text-5xl text-pink-950 font-light leading-tight mb-6">
              {contenido.titulo}
            </h1>
          )}
          <div className="space-y-4 text-[#6B7280] text-sm sm:text-base leading-relaxed">
            {parrafos.map((parrafo, index) => (
              <p key={index}>{parrafo}</p>
            ))}
          </div>
          {contenido.ctaTexto && contenido.ctaDestino && (
            <Link
              to={contenido.ctaDestino}
              className="btn-premium-primary mt-8 inline-flex px-8 py-4 text-xs font-semibold"
            >
              {contenido.ctaTexto}
            </Link>
          )}
        </div>

        {mostrarFoto && (
          <div className="rounded-[28px] border border-pink-100 bg-[#FFF0F5] p-4 shadow-[0_20px_48px_rgba(141,26,68,0.10)]">
            <img
              src={fotoUrl}
              alt="Retrato de la fotografa"
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full rounded-[22px] object-cover object-center"
            />
          </div>
        )}
      </div>
    </section>
  );
}
