import React, { createContext, useContext, ReactNode } from "react";
import { useCarrito } from "../hooks/useCarrito";
import { Instrumento } from "../types/types";
import { CarritoItem, PedidoResponse } from "../types/pedido";

/**
 * Interface para el contexto del carrito
 * Define todos los métodos y propiedades disponibles
 */
interface CarritoContextType {
  // Estado
  items: CarritoItem[];
  mostrarCarrito: boolean;
  mensajePedido: string | null;
  loading: boolean;
  error: string | null;
  totalItems: number;
  totalPrecio: number;
  pedidoPendiente: PedidoResponse | null; // ✅ NUEVO

  // Métodos del carrito
  agregarAlCarrito: (instrumento: Instrumento, cantidad?: number) => void;
  actualizarCantidad: (instrumentoId: string, cantidad: number) => void;
  eliminarDelCarrito: (instrumentoId: string) => void;
  vaciarCarrito: () => void;
  toggleCarrito: () => void;

  // Métodos de pedido
  guardarPedido: () => Promise<PedidoResponse | null>;
  limpiarMensaje: () => void;
  limpiarCarritoDespuesDePago: () => void;
  limpiarPedidoPendiente: () => void;
  verificarPedidoPendienteRemoto: () => Promise<void>;
}

/**
 * Crear el contexto del carrito
 */
const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

/**
 * Hook para usar el contexto del carrito
 * Lanza error si se usa fuera del provider
 */
export const useCarritoContext = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error(
      "useCarritoContext debe ser usado dentro de un CarritoProvider",
    );
  }
  return context;
};

/**
 * Props del proveedor
 */
interface CarritoProviderProps {
  children: ReactNode;
}

/**
 * Proveedor del contexto del carrito
 * Envuelve la aplicación y proporciona acceso al carrito
 */
export const CarritoProvider: React.FC<CarritoProviderProps> = ({
  children,
}) => {
  // ✅ Usa el hook useCarrito para la lógica del carrito
  const carrito = useCarrito();

  return (
    <CarritoContext.Provider value={carrito}>
      {children}
    </CarritoContext.Provider>
  );
};

export default CarritoContext;
