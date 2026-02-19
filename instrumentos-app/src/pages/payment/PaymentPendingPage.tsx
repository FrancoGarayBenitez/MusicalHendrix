import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCarritoContext } from "../../context/CarritoContext";
import { verificarEstadoPago } from "../../service/api";
import Loading from "../../components/common/Loading";
import "./PaymentPages.css";

const PaymentPendingPage: React.FC = () => {
  const navigate = useNavigate();
  const { limpiarPedidoPendiente } = useCarritoContext();
  const [procesandoRedireccion, setProcesandoRedireccion] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get("status");
    const preferenceId =
      urlParams.get("preference_id") ||
      localStorage.getItem("mp_preference_id");

    const finalizarPagoExitoso = () => {
      limpiarPedidoPendiente();
      localStorage.removeItem("mp_preference_id");
      navigate("/payment/success", { replace: true });
    };

    // 1. SI YA VIENE APROBADO DESDE MERCADO PAGO
    if (status === "approved") {
      console.log("✅ Redirección con éxito detectada, saltando a Success.");
      finalizarPagoExitoso();
      return;
    }

    // 2. SI NO ES APROBADO (PENDIENTE O ERROR), VERIFICAMOS UNA VEZ CON EL BACKEND
    if (preferenceId) {
      verificarEstadoPago(preferenceId)
        .then((res) => {
          if (res.estado === "approved") {
            finalizarPagoExitoso();
          } else if (res.estado === "rejected") {
            navigate("/payment/failure", { replace: true });
          } else {
            // Si realmente sigue pendiente (ej. pago en efectivo)
            setProcesandoRedireccion(false);
          }
        })
        .catch(() => setProcesandoRedireccion(false));
    } else {
      setProcesandoRedireccion(false);
    }
  }, [navigate, limpiarPedidoPendiente]);

  // MIENTRAS DECIDE QUÉ HACER, SOLO MUESTRA UN LOADER LIMPIO
  if (procesandoRedireccion) {
    return (
      <div className="payment-status-page pending">
        <Loading message="Procesando tu pago..." />
      </div>
    );
  }

  // SOLO SI FALLA TODO O SIGUE PENDIENTE DESPUÉS DE LA VERIFICACIÓN
  return (
    <div className="payment-status-page timeout">
      <div className="status-icon">⏳</div>
      <h1>Pago en proceso</h1>
      <p>Estamos esperando la confirmación de Mercado Pago.</p>
      <div className="payment-actions">
        <button
          className="btn-primary"
          onClick={() => window.location.reload()}
        >
          🔄 Actualizar estado
        </button>
        <button
          className="btn-secondary"
          onClick={() => navigate("/mis-pedidos")}
        >
          Ir a Mis Pedidos
        </button>
      </div>
    </div>
  );
};

export default PaymentPendingPage;
