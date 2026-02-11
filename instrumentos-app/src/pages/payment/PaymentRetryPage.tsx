import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verificarPagoAprobado } from "../../service/api";
import MercadoPagoButton from "../../components/pagos/MercadoPagoButton";
import Loading from "../../components/common/Loading";
import { EstadoPedido } from "../../types/pedido";
import "./PaymentPages.css";

const PaymentRetryPage: React.FC = () => {
  const { pedidoId } = useParams<{ pedidoId: string }>();
  const navigate = useNavigate();
  const [verificando, setVerificando] = useState(true);
  const [yaPagado, setYaPagado] = useState(false);

  useEffect(() => {
    const verificarEstado = async () => {
      if (!pedidoId) {
        navigate("/");
        return;
      }

      try {
        console.log("🔍 Verificando si el pedido ya fue pagado...");
        const pagado = await verificarPagoAprobado(pedidoId);

        if (pagado) {
          console.log("✅ El pedido ya está pagado");
          setYaPagado(true);
        }
      } catch (error) {
        console.error("Error al verificar estado:", error);
      } finally {
        setVerificando(false);
      }
    };

    verificarEstado();
  }, [pedidoId, navigate]);

  const handlePaymentCreated = () => {
    console.log("💳 Pago reiniciado correctamente");
  };

  const handlePaymentError = (errorMsg: string) => {
    console.error("❌ Error al reiniciar el pago:", errorMsg);
    alert(`Error: ${errorMsg}`);
  };

  if (verificando) {
    return (
      <div className="payment-status-page">
        <Loading message="Verificando estado del pedido..." />
      </div>
    );
  }

  if (yaPagado) {
    return (
      <div className="payment-status-page success">
        <div className="status-icon">✅</div>
        <h1>Pedido Ya Pagado</h1>
        <div className="payment-details">
          <p>Este pedido ya ha sido pagado exitosamente.</p>
          <p>
            Pedido: <strong>#{pedidoId}</strong>
          </p>
        </div>
        <div className="payment-actions">
          <button
            className="btn-primary"
            onClick={() => navigate("/mis-pedidos")}
          >
            Ver mis pedidos
          </button>
          <button className="btn-secondary" onClick={() => navigate("/")}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-status-page retry">
      <div className="status-icon">🔄</div>
      <h1>Reintentar Pago</h1>

      <div className="payment-details">
        <p>
          Pedido: <strong>#{pedidoId}</strong>
        </p>
        <p>Intenta realizar el pago nuevamente.</p>
        <p className="info-text">
          Si el problema persiste, contacta con soporte.
        </p>
      </div>

      {pedidoId && (
        <div className="retry-payment-container">
          <MercadoPagoButton
            pedidoId={pedidoId}
            estadoPedido={EstadoPedido.PENDIENTE_PAGO}
            onPaymentCreated={handlePaymentCreated}
            onPaymentError={handlePaymentError}
          />
        </div>
      )}

      <div className="payment-actions">
        <button
          className="btn-secondary"
          onClick={() => navigate("/mis-pedidos")}
        >
          Ver mis pedidos
        </button>
        <button className="btn-secondary" onClick={() => navigate("/")}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default PaymentRetryPage;
