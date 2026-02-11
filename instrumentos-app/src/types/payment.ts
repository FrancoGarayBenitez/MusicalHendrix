// ✅ ALINEADO CON: MercadoPagoResponseDTO.java
export interface MercadoPagoResponse {
  preferenceId: string; // ✅ Cambiado de 'id' a 'preferenceId'
  initPoint: string; // ✅ Cambiado de 'init_point' a 'initPoint'
  sandboxInitPoint: string; // ✅ Cambiado de 'sandbox_init_point' a 'sandboxInitPoint'
  error?: string; // Campo opcional para manejo de errores
}

// ✅ ALINEADO CON: PagoResponseDTO.java
export interface PagoResponse {
  idPago: number;
  idPedido: number;
  mercadoPagoPreferenceId: string;
  mercadoPagoPaymentId?: string | null;
  estado: string; // pending, approved, rejected, cancelled, in_process
  fechaCreacion: string | Date;
  fechaActualizacion?: string | Date | null;
  monto: number;
  descripcion?: string | null;
  // ✅ Helpers del backend (ya vienen calculados)
  aprobado: boolean;
  pendiente: boolean;
  rechazado: boolean;
}

// ✅ NUEVO: Tipo para la respuesta del endpoint de verificación de estado
export interface PagoStatusResponse {
  preferenceId: string;
  estado: "approved" | "pending" | "in_process" | "rejected" | string;
  mensaje: string;
  timestamp?: string | Date;
}

// ✅ Estados de pago posibles (según MercadoPago)
export enum EstadoPago {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
  IN_PROCESS = "in_process",
}

// ✅ Payment Status (ahora PagoResponse ya incluye los helpers)
export type PaymentStatus = PagoResponse;

// ✅ Helper para validar estado de pago
export function validarEstadoPago(estado: string): boolean {
  return Object.values(EstadoPago).includes(estado as EstadoPago);
}

// ✅ Helper para obtener mensaje de estado
export function obtenerMensajeEstado(estado: string): string {
  switch (estado) {
    case EstadoPago.APPROVED:
      return "✅ Pago aprobado";
    case EstadoPago.PENDING:
      return "⏳ Pago pendiente";
    case EstadoPago.IN_PROCESS:
      return "🔄 Pago en proceso";
    case EstadoPago.REJECTED:
      return "❌ Pago rechazado";
    case EstadoPago.CANCELLED:
      return "🚫 Pago cancelado";
    default:
      return "❓ Estado desconocido";
  }
}

// ✅ Helper para obtener color según estado
export function obtenerColorEstado(estado: string): string {
  switch (estado) {
    case EstadoPago.APPROVED:
      return "#27ae60"; // Verde
    case EstadoPago.PENDING:
    case EstadoPago.IN_PROCESS:
      return "#f39c12"; // Naranja
    case EstadoPago.REJECTED:
    case EstadoPago.CANCELLED:
      return "#e74c3c"; // Rojo
    default:
      return "#95a5a6"; // Gris
  }
}

// ✅ DEPRECATED - Mantener para compatibilidad temporal
/** @deprecated Usar MercadoPagoResponse en su lugar */
export interface PaymentPreference {
  preference_id: string;
  init_point: string;
  sandbox_init_point?: string;
}

/** @deprecated Usar MercadoPagoResponse en su lugar */
export interface PaymentResponse {
  error?: string;
  preference_id?: string;
  init_point?: string;
  sandbox_init_point?: string;
}
