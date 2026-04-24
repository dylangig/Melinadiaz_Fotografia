import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Inicio from './pages/Inicio';
import Categoria from './pages/Categoria';
import TrabajoDetalle from './pages/TrabajoDetalle';
import Servicios from './pages/Servicios';
import Contacto from './pages/Contacto';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import { useFavicon } from './hooks/useFavicon';

export default function App() {
  useFavicon();
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"                                  element={<Inicio />} />
          <Route path="/galeria/:categoriaSlug"            element={<Categoria />} />
          <Route path="/galeria/:categoriaSlug/:trabajoSlug" element={<TrabajoDetalle />} />
          <Route path="/servicios"                         element={<Servicios />} />
          <Route path="/contacto"                          element={<Contacto />} />
          <Route path="/admin"                             element={<Admin />} />
          <Route path="*"                                  element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
