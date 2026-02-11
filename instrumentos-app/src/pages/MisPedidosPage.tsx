import React from "react";
import { Navigate, Link } from "react-router-dom";
import MisPedidos from "../components/pedidos/MisPedidos";
import { useAuth } from "../context/AuthContext";
import "./MisPedidosPage.css";

const MisPedidosPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // ✅ Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    console.warn("⚠️ Usuario no autenticado. Redirigiendo a login...");
    return <Navigate to="/login" state={{ from: "/mis-pedidos" }} replace />;
  }

  return (
    <div className="page-container mis-pedidos-page">
      <div className="page-header">
        <h1>📦 Mis Pedidos</h1>
        <p>
          Bienvenido <strong>{user?.email}</strong>, aquí puedes ver el
          historial de tus compras.
        </p>
      </div>

      <MisPedidos />

      <div className="page-actions">
        <Link to="/productos" className="btn-secondary">
          🛍️ Ver más productos
        </Link>
      </div>
    </div>
  );
};

export default MisPedidosPage;
