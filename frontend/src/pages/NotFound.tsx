import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 min-h-[60vh] animate-fade-up">
      <div className="text-6xl mb-6 animate-float">📷</div>
      <p className="font-playfair text-[8rem] sm:text-[12rem] font-bold text-pink-100 leading-none select-none">
        404
      </p>
      <p className="text-gray-400 text-xs tracking-[4px] uppercase mb-4">Momento no encontrado</p>
      <h1 className="font-playfair text-2xl sm:text-3xl text-pink-700 font-light mb-4">
        Esta página no existe
      </h1>
      <p className="text-gray-500 text-base leading-relaxed max-w-sm mb-8">
        Parece que el momento que buscás no está en nuestro álbum. Puede que la URL esté
        mal escrita o que la página haya sido movida.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          to="/"
          className="px-8 py-4 bg-pink-700 text-white rounded-full font-bold text-sm uppercase tracking-wide hover:bg-pink-900 transition-all hover:-translate-y-0.5"
        >
          Volver al inicio
        </Link>
        <Link
          to="/contacto"
          className="px-8 py-4 border-2 border-pink-100 text-pink-700 rounded-full font-bold text-sm uppercase tracking-wide hover:border-pink-700 transition-colors"
        >
          Contactanos
        </Link>
      </div>
    </div>
  );
}
