import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import Categoria from './pages/Categoria';
import TrabajoDetalle from './pages/TrabajoDetalle';
import Servicios from './pages/Servicios';
import SobreMi from './pages/SobreMi';
import Contacto from './pages/Contacto';
import NotFound from './pages/NotFound';
import { useFavicon } from './hooks/useFavicon';
import { ConfigProvider } from './context/ConfigContext';

const Admin = lazy(() => import('./pages/Admin'));

export default function App() {
  useFavicon();
  return (
    <ConfigProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/"                                  element={<Inicio />} />
            <Route path="/galeria/:categoriaSlug"            element={<Categoria />} />
            <Route path="/galeria/:categoriaSlug/:trabajoSlug" element={<TrabajoDetalle />} />
            <Route path="/servicios"                         element={<Servicios />} />
            <Route path="/sobre-mi"                          element={<SobreMi />} />
            <Route path="/contacto"                          element={<Contacto />} />
            <Route path="/admin"                             element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>}>
                <Admin />
              </Suspense>
            } />
            <Route path="*"                                  element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}
