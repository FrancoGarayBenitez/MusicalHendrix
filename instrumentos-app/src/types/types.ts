//modelo Categoria
export interface Categoria {
  idCategoriaInstrumento: number;
  denominacion: string;
}

//modelo Instrumento
export interface Instrumento {
  idInstrumento?: number;
  denominacion: string;
  marca: string;
  stock: number;
  descripcion: string;
  imagen: string;
  precioActual?: number;
  categoriaInstrumento: Categoria;
}

//estado para formularios
export interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
}

//imagenes del slider
export interface SliderImage {
  id: number;
  url: string;
  alt: string;
  caption?: string;
  description?: string;
}

export interface HistorialPrecioResponseDTO {
  id: number;
  instrumentoId: number;
  instrumentoDenominacion: string;
  precio: number;
  fechaVigencia: Date | string;
  vigente: boolean;
}
