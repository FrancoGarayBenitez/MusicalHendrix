import { Instrumento } from "./types";
import { Usuario } from "./auth";

/**
 * Estados de pedido - DEBE coincidir exactamente con EstadoPedido del backend
 */
export enum EstadoPedido {
  PENDIENTE_PAGO = "PENDIENTE_PAGO",
  PAGADO = "PAGADO",
  ENVIADO = "ENVIADO",
  ENTREGADO = "ENTREGADO",
  CANCELADO = "CANCELADO",
}

/**
 * Helper para obtener el texto legible del estado
 */
export const getEstadoTexto = (estado: EstadoPedido | string): string => {
  const estadosTexto: Record<string, string> = {
    PENDIENTE_PAGO: "Pendiente de Pago",
    PAGADO: "Pagado",
    ENVIADO: "Enviado",
    ENTREGADO: "Entregado",
    CANCELADO: "Cancelado",
  };
  return estadosTexto[estado] || estado;
};

/**
 * Helper para obtener clase CSS del estado
 */
export const getEstadoClass = (estado: EstadoPedido | string): string => {
  const estadosClass: Record<string, string> = {
    PENDIENTE_PAGO: "pendiente",
    PAGADO: "pagado",
    ENVIADO: "enviado",
    ENTREGADO: "completado",
    CANCELADO: "cancelado",
  };
  return estadosClass[estado] || "pendiente";
};

/**
 * Item en el carrito de compras
 */
export interface CarritoItem {
  instrumento: Instrumento;
  cantidad: number;
}

// ========================================
// REQUEST DTOs (Lo que envías al backend)
// ========================================

/**
 * Detalle de pedido REQUEST
 * ✅ ALINEADO CON: DetallePedidoRequestDTO.java
 */
export interface DetallePedidoRequest {
  instrumentoId: number;
  cantidad: number;
  precioUnitario: number;
}

/**
 * Usuario REQUEST simplificado
 * ✅ ALINEADO CON: PedidoRequestDTO.UsuarioRequestDTO.java
 */
export interface UsuarioRequest {
  idUsuario: number;
}

/**
 * Pedido REQUEST (crear nuevo pedido)
 * ✅ ALINEADO CON: PedidoRequestDTO.java
 */
export interface PedidoRequest {
  usuario: UsuarioRequest;
  detalles: DetallePedidoRequest[];
}

// ========================================
// RESPONSE DTOs (Lo que viene del backend)
// ========================================

/**
 * Detalle de pedido RESPONSE
 * ✅ ALINEADO CON: DetallePedidoDTO.java
 */
export interface DetallePedidoResponse {
  id: number;
  instrumento: Instrumento;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/**
 * Pedido RESPONSE
 * ✅ ALINEADO CON: PedidoResponseDTO.java
 */
export interface PedidoResponse {
  id: number;
  fecha: string | Date;
  estado: EstadoPedido;
  total: number;
  usuario: Usuario;
  detalles: DetallePedidoResponse[];
}

// ✅ ALIAS para compatibilidad (puedes usar Pedido o PedidoResponse)
export type Pedido = PedidoResponse;
export type DetallePedido = DetallePedidoResponse;

// ========================================
// Interfaces adicionales para el frontend
// ========================================

/**
 * Estado del carrito de compras
 */
export interface CarritoState {
  items: CarritoItem[];
  mostrarCarrito: boolean;
  mensajePedido: string | null;
}

// ========================================
// Helper Functions
// ========================================

/**
 * Convierte items del carrito a DetallePedidoRequest[]
 * Calcula el precio unitario actual del instrumento
 */
export function convertirCarritoADetalles(
  items: CarritoItem[],
): DetallePedidoRequest[] {
  return items.map((item) => ({
    instrumentoId: item.instrumento.idInstrumento!,
    cantidad: item.cantidad,
    precioUnitario: item.instrumento.precioActual || 0,
  }));
}

/**
 * Calcula el total del carrito
 */
export function calcularTotalCarrito(items: CarritoItem[]): number {
  return items.reduce((total, item) => {
    const precio = item.instrumento.precioActual || 0;
    return total + precio * item.cantidad;
  }, 0);
}

/**
 * Valida que un item del carrito tenga precio
 */
export function validarItemCarrito(item: CarritoItem): boolean {
  return (
    item.instrumento.precioActual !== undefined &&
    item.instrumento.precioActual > 0 &&
    item.cantidad > 0
  );
}

/**
 * Valida que todos los items del carrito sean válidos
 */
export function validarCarrito(items: CarritoItem[]): {
  valido: boolean;
  errores: string[];
} {
  const errores: string[] = [];

  if (items.length === 0) {
    errores.push("El carrito está vacío");
  }

  items.forEach((item, index) => {
    if (!item.instrumento.idInstrumento) {
      errores.push(`Item ${index + 1}: No tiene ID de instrumento`);
    }

    if (!item.instrumento.precioActual || item.instrumento.precioActual <= 0) {
      errores.push(`${item.instrumento.denominacion}: No tiene precio válido`);
    }

    if (item.cantidad <= 0) {
      errores.push(`${item.instrumento.denominacion}: Cantidad inválida`);
    }

    if (item.cantidad > item.instrumento.stock) {
      errores.push(
        `${item.instrumento.denominacion}: Stock insuficiente (disponible: ${item.instrumento.stock})`,
      );
    }
  });

  return {
    valido: errores.length === 0,
    errores,
  };
}
