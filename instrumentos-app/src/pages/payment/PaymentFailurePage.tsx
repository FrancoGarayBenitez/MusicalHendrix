import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCarritoContext } from "../../context/CarritoContext";
import "./PaymentPages.css";

const PaymentFailurePage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verificarPedidoPendienteRemoto } = useCarritoContext();

  const queryParams = new URLSearchParams(location.search);
  const pedidoId =
    queryParams.get("pedido_id") ||
    queryParams.get("external_reference") ||
    localStorage.getItem("last_pedido_id");

  useEffect(() => {
    // Verificar si aún hay pedido pendiente después del fallo
    verificarPedidoPendienteRemoto();
  }, [verificarPedidoPendienteRemoto]);

  return (
    <div className="payment-status-page failure">
      <div className="status-icon">❌</div>
      <h1>Pago Rechazado</h1>

      <div className="payment-details">
        <p>Tu pago no pudo ser procesado.</p>
        {pedidoId && (
          <p>
            Pedido: <strong>#{pedidoId}</strong>
          </p>
        )}
        <p>
          Puedes intentar nuevamente con otro método de pago o contactar con
          soporte.
        </p>

        <div className="error-reasons">
          <h3>Posibles causas:</h3>
          <ul>
            <li>Fondos insuficientes</li>
            <li>Datos de tarjeta incorrectos</li>
            <li>Tarjeta vencida o bloqueada</li>
            <li>Límites de compra excedidos</li>
          </ul>
        </div>
      </div>

      <div className="payment-actions">
        <button
          className="btn-primary"
          onClick={() => navigate("/mis-pedidos")}
        >
          Intentar nuevamente
        </button>
        <button className="btn-secondary" onClick={() => navigate("/")}>
          Volver al inicio
        </button>
        <button className="btn-outline" onClick={() => navigate("/contacto")}>
          Contactar soporte
        </button>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
