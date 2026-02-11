import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Loading from "../../components/common/Loading";

const PaymentRedirectPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const status = queryParams.get("status");
    const pedidoId =
      queryParams.get("pedidoId") || queryParams.get("external_reference");

    console.log("🔄 Redirección de pago recibida:", {
      status,
      pedidoId,
      fullSearch: location.search,
    });

    // Guardar pedidoId en localStorage para las páginas de destino
    if (pedidoId) {
      localStorage.setItem("last_pedido_id", pedidoId);
    }

    // Redirigir según el estado
    switch (status) {
      case "approved":
        navigate("/payment/success");
        break;
      case "rejected":
        navigate("/payment/failure");
        break;
      case "pending":
        navigate("/payment/pending");
        break;
      default:
        console.warn("Estado de pago desconocido:", status);
        navigate("/payment/pending");
    }
  }, [location.search, navigate]);

  return (
    <div className="payment-status-page">
      <Loading message="Procesando resultado del pago..." />
    </div>
  );
};

export default PaymentRedirectPage;
