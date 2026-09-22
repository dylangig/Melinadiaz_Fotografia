import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { useSEO } from '../hooks/useSEO';

const R2 = 'https://imagenes.melinadiazfotografia.com.ar';

interface FormErrors {
  nombre?: string;
  telefono?: string;
  tipo?: string;
}

export default function Contacto() {
  const { whatsapp, email } = useConfig();
  useSEO({
    title: 'Contacto | Melina Diaz Fotografía',
    description: 'Consultá disponibilidad para books infantiles, 15 años y bodas en Zona Sur del Gran Buenos Aires. Escribime y te respondo en menos de 24 hs.',
  });
  const [nombre,   setNombre]   = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipo,     setTipo]     = useState('');
  const [fecha,    setFecha]    = useState('');
  const [consulta, setConsulta] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState('');

  const whatsappLink = (mensaje = 'Hola Melina, vi tu web y quería consultar por una sesión de fotos.') =>
    `https://wa.me/${whatsapp}?text=${encodeURIComponent(mensaje)}`;

  const mailtoLink = email
    ? `mailto:${email}?subject=${encodeURIComponent('Consulta desde la web')}&body=${encodeURIComponent('Hola Melina, vi tu web y quería consultar por una sesión de fotos.')}`
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

    let mensaje = 'Hola Melina, vi tu web y quería consultar por una sesión de fotos.';
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
    <div className="min-h-screen flex flex-col">

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
          <h1 className="font-playfair text-3xl sm:text-[2.6rem] text-pink-950 font-bold leading-tight mb-4 relative z-10">
            Tu momento especial merece{' '}
            <em className="italic font-light text-pink-700">fotos que duren toda la vida</em>
          </h1>
          <p className="text-pink-900/70 text-sm leading-relaxed mb-8 max-w-sm relative z-10">
            Completá el formulario y en menos de 24 hs te contacto para coordinar tu sesión. Sin compromiso.
          </p>

          {/* Beneficios */}
          <div className="flex flex-col gap-4 mb-8 relative z-10">
            {[
              { icon: 'Foto', text: 'Fotos ilimitadas durante toda la sesión, editadas en alta calidad' },
              { icon: 'Drive', text: 'Entrega por Google Drive en tiempo y forma' },
              { icon: 'Zona', text: 'Nos movemos por toda la Zona Sur de Buenos Aires' },
              { icon: 'Chat', text: 'Atención personalizada desde el primer mensaje' },
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-4 text-pink-950/80 text-sm leading-relaxed">
                <span className="text-[10px] font-bold uppercase tracking-widest text-pink-700 bg-white/60 rounded-full px-2 py-1">{b.icon}</span>
                <span>{b.text}</span>
              </div>
            ))}
          </div>

          {/* Mini testimonios */}
          <div className="flex flex-col gap-4 relative z-10">
            {[
              { texto: '"Melina nos hizo sentir cómodos en todo momento y los resultados superaron todas nuestras expectativas."', autora: 'Sofía L. - 15 años' },
              { texto: '"Las fotos del book de mi nena son una obra de arte. Tiene una sensibilidad especial para los chicos."', autora: 'Laura P. - Book infantil' },
            ].map((t, i) => (
              <div key={i} className="bg-white/55 backdrop-blur-sm border border-white/60 rounded-xl p-4">
                <div className="text-pink-500 text-xs mb-2 tracking-widest">*****</div>
                <p className="text-pink-950/70 text-xs italic leading-relaxed mb-2">{t.texto}</p>
                <span className="text-pink-700 text-[10px] font-bold tracking-widest uppercase">{t.autora}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha - Formulario */}
        <div className="bg-[#FAFAFA] px-8 sm:px-14 py-14 flex flex-col justify-center">
          <h2 className="font-playfair text-pink-700 text-2xl font-light mb-1">Reservá tu sesión</h2>
          <p className="text-gray-400 text-xs tracking-[2px] uppercase mb-6">Respuesta en menos de 24 hs</p>

          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-4 mb-8 text-green-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0 animate-pulse-green" />
            Lugares disponibles para los próximos meses - Consultá ahora
          </div>

          {/* Nombre + Teléfono */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 tracking-[1.5px] uppercase mb-2">Nombre</label>
              <input
                type="text"
                placeholder="Tu nombre"
                maxLength={50}
                value={nombre}
                onChange={e => { setNombre(e.target.value); clearError('nombre'); }}
                className={`w-full px-4 py-4 border-[1.5px] rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-700/10 transition-all ${
                  errors.nombre ? 'border-red-300 bg-red-50/40' : 'border-pink-100 focus:border-pink-700'
                }`}
              />
              {errors.nombre && <p className="mt-2 text-[11px] font-semibold text-red-500">{errors.nombre}</p>}
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 tracking-[1.5px] uppercase mb-2">Teléfono</label>
              <input
                type="tel"
                placeholder="+54 9 11..."
                maxLength={20}
                value={telefono}
                onChange={e => { setTelefono(e.target.value); clearError('telefono'); }}
                className={`w-full px-4 py-4 border-[1.5px] rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-700/10 transition-all ${
                  errors.telefono ? 'border-red-300 bg-red-50/40' : 'border-pink-100 focus:border-pink-700'
                }`}
              />
              {errors.telefono && <p className="mt-2 text-[11px] font-semibold text-red-500">{errors.telefono}</p>}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-bold text-gray-400 tracking-[1.5px] uppercase mb-2">¿Qué tipo de sesión querés?</label>
            <select
              value={tipo}
              onChange={e => { setTipo(e.target.value); clearError('tipo'); }}
              className={`w-full px-4 py-4 border-[1.5px] rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-700/10 transition-all ${
                errors.tipo ? 'border-red-300 bg-red-50/40' : 'border-pink-100 focus:border-pink-700'
              }`}
            >
              <option value="" disabled>Seleccioná una opción</option>
              <option value="Book Infantil">Book Infantil</option>
              <option value="15 Años">15 Años</option>
              <option value="Boda">Boda</option>
              <option value="Otro">Otro</option>
            </select>
            {errors.tipo && <p className="mt-2 text-[11px] font-semibold text-red-500">{errors.tipo}</p>}
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-bold text-gray-400 tracking-[1.5px] uppercase mb-2">¿Cuándo sería el evento?</label>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              className="w-full px-4 py-4 border-[1.5px] border-pink-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-pink-700 focus:ring-2 focus:ring-pink-700/10 transition-all"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[11px] font-bold text-gray-400 tracking-[1.5px] uppercase mb-2">Contame sobre tu evento</label>
            <textarea
              placeholder="Cuántas personas, lugar que tenías en mente, algún detalle especial..."
              maxLength={500}
              value={consulta}
              onChange={e => setConsulta(e.target.value)}
              rows={3}
              className="w-full px-4 py-4 border-[1.5px] border-pink-100 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-pink-700 focus:ring-2 focus:ring-pink-700/10 transition-all resize-y"
            />
          </div>

          <button
            onClick={enviarWhatsApp}
            className="btn-premium-primary mt-2 w-full px-10 py-4 text-sm font-semibold"
          >
            Reservar sesión
          </button>

          {success && (
            <div className="mt-4 rounded-2xl border border-green-100 bg-green-50 px-4 py-4 text-sm font-semibold leading-relaxed text-green-700">
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
            <p className="mt-4 text-center text-[11px] text-gray-400">
              Tambien podes escribirnos a{' '}
              <a href={mailtoLink} className="font-bold text-pink-700 hover:text-pink-900">
                {email}
              </a>
            </p>
          )}

          <p className="text-center text-[11px] text-gray-300 mt-4 tracking-wide">
            Tu información es privada y no será compartida con terceros
          </p>

          <Link to="/" className="text-gray-300 text-xs uppercase tracking-widest hover:text-pink-300 transition-colors mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
