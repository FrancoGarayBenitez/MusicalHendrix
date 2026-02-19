import React, { useState } from "react";
import { createPayment } from "../../service/api";
import { EstadoPedido } from "../../types/pedido";
import { MercadoPagoResponse } from "../../types/payment";
import "./MercadoPagoButton.css";

interface MercadoPagoButtonProps {
  pedidoId: number;
  estadoPedido?: EstadoPedido | string;
  onPaymentCreated?: () => void;
  onPaymentError?: (error: string) => void;
}

const MercadoPagoButton: React.FC<MercadoPagoButtonProps> = ({
  pedidoId,
  estadoPedido,
  onPaymentCreated,
  onPaymentError,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (estadoPedido !== EstadoPedido.PENDIENTE_PAGO) {
    return (
      <div className="mercadopago-button-wrapper">
        <div className="payment-completed">
          <p className="success-message">
            ✅ Este pedido ya ha sido pagado o procesado.
          </p>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);
      console.log("💳 Solicitando preferencia de pago para pedido:", pedidoId);

      // 1. Llamar al backend para crear la preferencia
      const response: MercadoPagoResponse = await createPayment(pedidoId);

      if (response.error || !response.initPoint) {
        throw new Error(response.error || "No se pudo obtener la URL de pago.");
      }

      // 2. Guardar el preferenceId para cuando el usuario vuelva
      localStorage.setItem("mp_preference_id", response.preferenceId);

      if (onPaymentCreated) {
        onPaymentCreated();
      }

      // 3. REDIRECCIÓN EN LA MISMA PESTAÑA
      // Usamos assign para que el proceso sea fluido
      console.log("🌐 Redirigiendo a Mercado Pago en la misma pestaña...");
      window.location.assign(response.initPoint);
    } catch (err) {
      console.error("❌ Error al crear el pago:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error al conectar con Mercado Pago";
      setError(errorMessage);
      if (onPaymentError) onPaymentError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="mercadopago-button-wrapper">
      <button
        className="iniciar-pago-btn"
        onClick={handlePayment}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner"></span> Redirigiendo...
          </>
        ) : (
          "💳 Pagar con MercadoPago"
        )}
      </button>

      {error && (
        <div className="payment-error">
          <p className="error-message">❌ {error}</p>
          <button className="retry-btn" onClick={() => handlePayment()}>
            🔄 Reintentar
          </button>
        </div>
      )}
    </div>
  );
};

export default MercadoPagoButton;
