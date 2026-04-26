import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const R2 = 'https://imagenes.melinadiazfotografia.com.ar';
const API_BASE = import.meta.env.VITE_API_URL || '';
const DEFAULT_WHATSAPP = '5491176348089';
const DEFAULT_WHATSAPP_MESSAGE = 'Hola Melina, vi tu web y quería consultar por una sesión de fotos.';

interface FormErrors {
  nombre?: string;
  telefono?: string;
  tipo?: string;
}

export default function Contacto() {
  const [nombre,   setNombre]   = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipo,     setTipo]     = useState('');
  const [fecha,    setFecha]    = useState('');
  const [consulta, setConsulta] = useState('');
  const [whatsapp, setWhatsapp] = useState(DEFAULT_WHATSAPP);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/configuracion`)
      .then(r => { if (r.ok) return r.json(); throw new Error(); })
      .then(data => {
        if (data?.whatsapp) setWhatsapp(data.whatsapp);
        if (data?.email) setEmail(data.email);
      })
      .catch(() => {});
  }, []);

  const whatsappLink = (mensaje = DEFAULT_WHATSAPP_MESSAGE) =>
    `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`;

  const mailtoLink = email
    ? `mailto:${email}?subject=${encodeURIComponent('Consulta desde la web')}&body=${encodeURIComponent(DEFAULT_WHATSAPP_MESSAGE)}`
    : '';

  const validarFormulario = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const telefonoLimpio = telefono.replace(/[^\d]/g, '');

    if (!nombre.trim()) nextErrors.nombre = 'Decinos tu nombre para poder responderte.';
    if (!telefono.trim()) nextErrors.telefono = 'Dejanos un telefono o WhatsApp de contacto.';
    else if (telefonoLimpio.length < 8) nextErrors.telefono = 'Revisa el numero: parece demasiado corto.';
    if (!tipo) nextErrors.tipo = 'Elegi el tipo de sesion que te interesa.';

    return nextErrors;
  };

  const clearError = (field: keyof FormErrors) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setSuccess('');
  };

  const enviarWhatsApp = () => {
    const nextErrors = validarFormulario();
    setErrors(nextErrors);
    setSuccess('');
    if (Object.values(nextErrors).some(Boolean)) return;

    let mensaje = DEFAULT_WHATSAPP_MESSAGE;
    mensaje += `\n\nSoy ${nombre.trim()}.`;
    mensaje += `\nMi telefono es ${telefono.trim()}.`;
    mensaje += `\nEstoy interesada en: ${tipo}.`;
    if (fecha) mensaje += `\nFecha tentativa: ${fecha}.`;
    if (consulta.trim()) mensaje += `\n\n${consulta.trim()}`;

    window.open(whatsappLink(mensaje), '_blank', 'noopener,noreferrer');
    setSuccess('Gracias, recibimos tu consulta. Te vamos a responder pronto.');
    setNombre('');
    setTelefono('');
    setTipo('');
    setFecha('');
    setConsulta('');
  };

  return (
    <div className="min-h-screen flex flex-col -mx-4 sm:-mx-6">

      {/* Topbar propio (reemplaza la navbar global en esta página) */}
      <div className="flex items-center justify-between px-6 sm:px-10 py-3.5 bg-[#FFF6F8]/95 border-b border-pink-100 sticky top-0 z-50">
        <Link to="/">
          <img
            src={`${R2}/logo.webp`}
            alt="Melina Diaz Fotografía"
            loading="eager"
            decoding="async"
            className="h-12 w-auto"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </Link>
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-pink-700 font-semibold text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#d81b60">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          +{whatsapp}
        </a>
      </div>

      {/* Cuerpo de dos columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 flex-1">

        {/* Columna izquierda - Info */}
        <div className="relative bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200 px-8 sm:px-14 py-14 flex flex-col justify-center overflow-hidden">
          {/* Burbujas decorativas */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/15 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

          <p className="text-xs tracking-[4px] uppercase text-pink-800 font-semibold mb-4 relative z-10">
            Fotografía Profesional · Zona Sur
          </p>
          <h1 className="font-playfair text-3xl sm:text-[2.6rem] text-pink-950 font-bold leading-tight mb-5 relative z-10">
            Tu momento especial merece{' '}
            <em className="italic font-light text-pink-700">fotos que duren toda la vida</em>
          </h1>
          <p className="text-pink-900/70 text-sm leading-relaxed mb-8 max-w-sm relative z-10">
            Completá el formulario y en menos de 24 hs te contacto para coordinar tu sesión. Sin compromiso.
          </p>

          {/* Beneficios */}
          <div className="flex flex-col gap-3.5 mb-8 relative z-10">
            {[
              { icon: 'Foto', text: 'Fotos ilimitadas durante toda la sesión, editadas en alta calidad' },
              { icon: 'Drive', text: 'Entrega por Google Drive en tiempo y forma' },
              { icon: 'Zona', text: 'Nos movemos por toda la Zona Sur de Buenos Aires' },
              { icon: 'Chat', text: 'Atención personalizada desde el primer mensaje' },
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-3 text-pink-950/80 text-sm leading-relaxed">
                <span className="text-[10px] font-bold uppercase tracking-widest text-pink-700 bg-white/60 rounded-full px-2 py-1">{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>

          {/* Mini testimonios */}
          <div className="flex flex-col gap-3 relative z-10">
            {[
              { texto: '"Melina nos hizo sentir cómodos en todo momento y los resultados superaron todas nuestras expectativas."', autora: 'Sofía L. - 15 años' },
              { texto: '"Las fotos del book de mi nena son una obra de arte. Tiene una sensibilidad especial para los chicos."', autora: 'Laura P. - Book infantil' },
            ].map((t, i) => (
              <div key={i} className="bg-white/55 backdrop-blur-sm border border-white/60 rounded-xl p-4">
                <div className="text-pink-500 text-xs mb-1.5 tracking-widest">*****</div>
                <p className="text-pink-950/70 text-xs italic leading-relaxed mb-1.5">{t.texto}</p>
                <span className="text-pink-700 text-[10px] font-bold tracking-widest uppercase">{t.autora}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha - Formulario */}
        <div className="bg-[#FAFAFA] px-8 sm:px-14 py-14 flex flex-col justify-center">
          <h2 className="font-playfair text-pink-700 text-2xl font-light mb-1">Reservá tu sesión</h2>
          <p className="text-gray-400 text-xs tracking-[2px] uppercase mb-6">Respuesta en menos de 24 hs</p>

          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 mb-7 text-green-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse-green" />
            Lugares disponibles para los próximos meses - Consultá ahora
          </div>

          {/* Nombre + Teléfono */}
          <div className="grid grid-cols-2 gap-3.5 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 tracking-[1.5px] uppercase mb-1.5">Nombre</label>
              <input
                type="text"
                placeholder="Tu nombre"
                maxLength={50}
                value={nombre}
                onChange={e => { setNombre(e.target.value); clearError('nombre'); }}
                className={`w-full px-4 py-3 border-[1.5px] rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-700/10 transition-all ${
                  errors.nombre ? 'border-red-300 bg-red-50/40' : 'border-pink-100 focus:border-pink-700'
                }`}
              />
              {errors.nombre && <p className="mt-1.5 text-[11px] font-semibold text-red-500">{errors.nombre}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 tracking-[1.5px] uppercase mb-1.5">Teléfono</label>
              <input
                type="tel"
                placeholder="+54 9 11..."
                maxLength={20}
                value={telefono}
                onChange={e => { setTelefono(e.target.value); clearError('telefono'); }}
                className={`w-full px-4 py-3 border-[1.5px] rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-700/10 transition-all ${
                  errors.telefono ? 'border-red-300 bg-red-50/40' : 'border-pink-100 focus:border-pink-700'
                }`}
              />
              {errors.telefono && <p className="mt-1.5 text-[11px] font-semibold text-red-500">{errors.telefono}</p>}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-bold text-gray-400 tracking-[1.5px] uppercase mb-1.5">¿Qué tipo de sesión querés?</label>
            <select
              value={tipo}
              onChange={e => { setTipo(e.target.value); clearError('tipo'); }}
              className={`w-full px-4 py-3 border-[1.5px] rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-700/10 transition-all ${
                errors.tipo ? 'border-red-300 bg-red-50/40' : 'border-pink-100 focus:border-pink-700'
              }`}
            >
              <option value="" disabled>Seleccioná una opción</option>
              <option value="Book Infantil">Book Infantil</option>
              <option value="15 Años">15 Años</option>
              <option value="Boda">Boda</option>
              <option value="Otro">Otro</option>
            </select>
            {errors.tipo && <p className="mt-1.5 text-[11px] font-semibold text-red-500">{errors.tipo}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-bold text-gray-400 tracking-[1.5px] uppercase mb-1.5">¿Cuándo sería el evento?</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full px-4 py-3 border-[1.5px] border-pink-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-pink-700 focus:ring-2 focus:ring-pink-700/10 transition-all"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-bold text-gray-400 tracking-[1.5px] uppercase mb-1.5">Contame sobre tu evento</label>
            <textarea
              placeholder="Cuántas personas, lugar que tenías en mente, algún detalle especial..."
              maxLength={500}
              value={consulta}
              onChange={e => setConsulta(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-[1.5px] border-pink-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-pink-700 focus:ring-2 focus:ring-pink-700/10 transition-all resize-y"
            />
          </div>

          <button
            onClick={enviarWhatsApp}
            className="btn-premium-primary mt-2 w-full px-10 py-4 text-sm font-semibold"
          >
            Reservar sesión
          </button>

          {success && (
            <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold leading-relaxed text-green-700">
              {success}
            </div>
          )}

          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block text-center text-xs font-bold uppercase tracking-widest text-pink-700 hover:text-pink-900"
          >
            Consultar por WhatsApp
          </a>

          {email && (
            <p className="mt-3 text-center text-[11px] text-gray-400">
              Tambien podes escribirnos a{' '}
              <a href={mailtoLink} className="font-bold text-pink-700 hover:text-pink-900">
                {email}
              </a>
            </p>
          )}

          <p className="text-center text-[11px] text-gray-300 mt-3.5 tracking-wide">
            Tu información es privada y no será compartida con terceros
          </p>

          <Link to="/" className="text-gray-300 text-xs uppercase tracking-widest hover:text-pink-300 transition-colors mt-5 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
