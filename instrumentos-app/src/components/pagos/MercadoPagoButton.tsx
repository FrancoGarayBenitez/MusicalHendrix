import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPayment } from "../../service/api"; // ✅ API actualizada
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
  const navigate = useNavigate();

  // Si el estado del pedido no es 'PENDIENTE_PAGO', no se muestra el botón.
  // Esta lógica se maneja en MisPedidos.tsx, pero es una buena práctica tenerla aquí también.
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

    if (!pedidoId || isNaN(pedidoId) || pedidoId <= 0) {
      const errorMsg = "ID de pedido inválido. No se puede procesar el pago.";
      setError(errorMsg);
      if (onPaymentError) onPaymentError(errorMsg);
      return;
    }

    // ✅ 1. ABRIR LA NUEVA PESTAÑA INMEDIATAMENTE
    let checkoutWindow: Window | null = null;
    try {
      checkoutWindow = window.open("", "_blank");
      if (checkoutWindow) {
        checkoutWindow.document.write(`
          <html>
            <head><title>Redirigiendo a Mercado Pago...</title></head>
            <body>
              <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                <h1>🔄 Conectando con MercadoPago...</h1>
                <p>Por favor, espera mientras te redirigimos al checkout seguro.</p>
                <div style="margin: 20px;">
                  <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #009ee3; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
                <style>
                  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                </style>
              </div>
            </body>
          </html>
        `);
      } else {
        throw new Error(
          "Por favor, habilita las ventanas emergentes para continuar con el pago.",
        );
      }
    } catch (popupError) {
      setError(
        "Por favor, habilita las ventanas emergentes para continuar con el pago.",
      );
      if (onPaymentError) onPaymentError("Pop-up bloqueado.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("💳 Iniciando proceso de pago para pedido:", pedidoId);

      // 2. Llamar al backend para crear la preferencia de pago
      const response: MercadoPagoResponse = await createPayment(pedidoId);
      console.log("📥 Respuesta de MercadoPago:", response);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.preferenceId || !response.initPoint) {
        throw new Error(
          "Respuesta inválida de MercadoPago. No se pudo obtener la URL de pago.",
        );
      }

      // 3. Guardar el preferenceId en localStorage
      console.log(
        "💾 Guardando preferenceId en localStorage:",
        response.preferenceId,
      );
      localStorage.setItem("mp_preference_id", response.preferenceId);

      if (onPaymentCreated) {
        onPaymentCreated();
      }

      // 4. CARGAR LA URL DE MP EN LA PESTAÑA YA ABIERTA
      console.log("🌐 Cargando URL de checkout:", response.initPoint);
      if (checkoutWindow && !checkoutWindow.closed) {
        checkoutWindow.location.href = response.initPoint;
      } else {
        // Si la ventana se cerró, abrir una nueva
        window.open(response.initPoint, "_blank");
      }

      // 5. NAVEGAR a la página de espera en la pestaña actual
      console.log("🔄 Navegando a la página de espera local.");
      navigate("/payment/pending");
    } catch (err) {
      console.error("❌ Error al crear el pago:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error desconocido al crear la preferencia de pago";
      setError(errorMessage);
      if (onPaymentError) onPaymentError(errorMessage);

      // Si hay un error, cerramos la ventana emergente
      if (checkoutWindow && !checkoutWindow.closed) {
        checkoutWindow.close();
      }
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handlePayment(); // Intenta el pago de nuevo
  };

  return (
    <div className="mercadopago-button-wrapper">
      <button
        className="iniciar-pago-btn"
        onClick={handlePayment}
        disabled={loading}
        title="Pagar con MercadoPago"
      >
        {loading ? (
          <>
            <span className="spinner"></span>⏳ Preparando pago...
          </>
        ) : (
          "💳 Pagar con MercadoPago"
        )}
      </button>

      {error && (
        <div className="payment-error">
          <p className="error-message">❌ {error}</p>
          <button className="retry-btn" onClick={handleRetry}>
            🔄 Reintentar
          </button>
        </div>
      )}

      <p className="payment-note">
        ℹ️ Serás redirigido a MercadoPago para completar el pago de forma
        segura.
      </p>
    </div>
  );
};

export default MercadoPagoButton;
