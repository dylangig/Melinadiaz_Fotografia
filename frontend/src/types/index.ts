export interface Categoria {
  nombre: string;
  slug: string;
  portada: string;
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
