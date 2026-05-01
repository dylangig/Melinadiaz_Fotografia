export interface Categoria {
  nombre: string;
  slug: string;
  portada: string;
  orden?: number;
  mostrarEnHome?: boolean;
}

export interface Trabajo {
  slug: string;
  nombre: string;
  año: string;
  fotos: string[];
  descripcion?: string;
  descripcion_evento?: string;
}

export interface Servicio {
  nombre: string;
  descripcion: string;
  fotos: string[];
}

export interface TrabajosData {
  [categoria: string]: Trabajo[];
}

export interface SobreMi {
  titulo: string;
  texto: string;
  fotoUrl: string;
  ctaTexto: string;
  ctaDestino: string;
}
