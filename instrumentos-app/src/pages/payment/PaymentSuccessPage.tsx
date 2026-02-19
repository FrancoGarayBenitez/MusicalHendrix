import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCarritoContext } from "../../context/CarritoContext";
import "./PaymentPages.css";

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { limpiarPedidoPendiente } = useCarritoContext();
  const [countdown, setCountdown] = useState(5);

  // Al cargar la página de éxito, nos aseguramos de que el estado de
  // pedido pendiente en la app se limpie.
  useEffect(() => {
    limpiarPedidoPendiente();
    localStorage.removeItem("mp_preference_id"); // Limpieza final por si acaso
  }, [limpiarPedidoPendiente]);

  // Cuenta regresiva para redirección opcional
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/mis-pedidos"); // Redirigir a "Mis Pedidos" es una buena opción
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="payment-status-page success">
      <div className="status-icon">✅</div>
      <h1>¡Pago Exitoso!</h1>

      <div className="payment-details">
        <p>Tu pago ha sido procesado correctamente.</p>
        <p>Recibirás un email de confirmación en los próximos minutos.</p>
      </div>

      <div className="next-steps">
        <h3>📦 ¿Qué sigue?</h3>
        <ul>
          <li>✅ Tu pedido está confirmado y en preparación.</li>
          <li>📧 Recibirás actualizaciones por email.</li>
          <li>🚚 Te contactaremos para coordinar la entrega.</li>
        </ul>
      </div>

      <div className="payment-actions">
        <Link to="/mis-pedidos" className="btn-primary">
          Ver detalles del pedido
        </Link>
        <Link to="/productos" className="btn-secondary">
          Seguir comprando
        </Link>
      </div>

      <p className="redirect-notice">
        Serás redirigido a 'Mis Pedidos' en {countdown} segundos...
      </p>
    </div>
  );
};

export default PaymentSuccessPage;
