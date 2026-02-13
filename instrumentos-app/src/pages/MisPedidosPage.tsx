import React from "react";
import { Navigate, Link } from "react-router-dom";
import MisPedidos from "../components/pedidos/MisPedidos";
import { useAuth } from "../context/AuthContext";

const MisPedidosPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // ✅ Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    console.warn("⚠️ Usuario no autenticado. Redirigiendo a login...");
    return <Navigate to="/login" state={{ from: "/mis-pedidos" }} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header de la página - Reducido */}
      <div className="bg-gradient-to-br from-musical-slate via-musical-teal to-musical-slate py-8 px-4 relative overflow-hidden">
        {/* Pattern de fondo opcional */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-6 left-10 w-24 h-24 bg-white rounded-full blur-2xl"></div>
          <div className="absolute bottom-6 right-10 w-20 h-20 bg-white rounded-full blur-2xl"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-1 bg-gradient-to-r from-transparent to-white rounded-full"></div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">📦</span>
              </div>
              <div className="w-8 h-1 bg-gradient-to-r from-white to-transparent rounded-full"></div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            Mis Pedidos
          </h1>

          <p className="text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            Bienvenido{" "}
            <span className="font-bold bg-white/20 px-2 py-1 rounded backdrop-blur-sm">
              {user?.email}
            </span>
            ,
            <br className="hidden sm:block" />
            aquí puedes ver el historial de tus compras
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Componente MisPedidos */}
        <MisPedidos />
      </div>
    </div>
  );
};

export default MisPedidosPage;
