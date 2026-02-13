import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCarritoContext } from "../../context/CarritoContext";
import { useAuth } from "../../context/AuthContext";
import CarritoItem from "./CarritoItem";
import Loading from "../common/Loading";
import MercadoPagoButton from "../pagos/MercadoPagoButton";
import { EstadoPedido } from "../../types/pedido";

const CarritoDrawer: React.FC = () => {
  const {
    items,
    mostrarCarrito,
    mensajePedido,
    loading,
    error,
    totalItems,
    totalPrecio,
    toggleCarrito,
    vaciarCarrito,
    guardarPedido,
    limpiarMensaje,
    limpiarCarritoDespuesDePago,
  } = useCarritoContext();

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // ✅ CORREGIDO: Ahora usa number en lugar de string
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [estadoPedido, setEstadoPedido] = useState<EstadoPedido>(
    EstadoPedido.PENDIENTE_PAGO,
  );

  // Verificar si hay pago en progreso al montar
  useEffect(() => {
    const savedPedidoId = localStorage.getItem("last_pedido_id");
    if (savedPedidoId && mensajePedido) {
      const pedidoIdNumber = parseInt(savedPedidoId, 10);
      if (!isNaN(pedidoIdNumber)) {
        setPedidoId(pedidoIdNumber);
        console.log("📦 Pedido en progreso encontrado:", pedidoIdNumber);
      }
    }
  }, [mensajePedido]);

  // Limpiar pedidoId cuando se cierra el mensaje
  useEffect(() => {
    if (!mensajePedido) {
      setPedidoId(null);
    }
  }, [mensajePedido]);

  if (!mostrarCarrito) return null;

  const handleGuardarPedido = async () => {
    try {
      // Verificar autenticación
      if (!isAuthenticated) {
        console.warn("⚠️ Usuario no autenticado");
        alert("Debes iniciar sesión para realizar un pedido");
        toggleCarrito();
        navigate("/login");
        return;
      }

      // Verificar que haya items
      if (items.length === 0) {
        console.error("❌ No hay items en el carrito");
        alert("El carrito está vacío");
        return;
      }

      // Verificar stock antes de crear pedido
      const itemsSinStock = items.filter(
        (item) => item.cantidad > item.instrumento.stock,
      );

      if (itemsSinStock.length > 0) {
        const nombres = itemsSinStock
          .map((item) => item.instrumento.denominacion)
          .join(", ");
        alert(
          `⚠️ Los siguientes productos no tienen stock suficiente: ${nombres}`,
        );
        return;
      }

      console.log("📝 Guardando pedido...");
      const pedidoResponse = await guardarPedido();

      if (pedidoResponse && pedidoResponse.id) {
        const idPedido = pedidoResponse.id;
        console.log("🎉 Pedido guardado con ID:", idPedido);

        setPedidoId(idPedido);
        setEstadoPedido(pedidoResponse.estado || EstadoPedido.PENDIENTE_PAGO);

        // Guardar en localStorage por si el usuario recarga la página
        localStorage.setItem("last_pedido_id", idPedido.toString());
        localStorage.setItem("last_pedido_timestamp", new Date().toISOString());
      } else {
        console.error("❌ No se recibió ID de pedido válido:", pedidoResponse);
        alert("Error al crear el pedido. Por favor, intenta nuevamente.");
      }
    } catch (err) {
      console.error("❌ Error al guardar el pedido:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      alert(`Error al crear el pedido: ${errorMessage}`);
    }
  };

  const handlePaymentCreated = () => {
    console.log("💳 Pago iniciado correctamente - redirigiendo a MercadoPago");

    // Guardar flag para saber que hay un pago en proceso
    localStorage.setItem("payment_in_progress", "true");

    // Cerrar drawer
    toggleCarrito();

    // El carrito se limpiará cuando el pago sea confirmado (en la página de success)
  };

  const handlePaymentError = (errorMsg: string) => {
    console.error("❌ Error al crear preferencia de pago:", errorMsg);
    alert(
      `Error al iniciar el pago: ${errorMsg}\n\nPor favor, intenta nuevamente.`,
    );
  };

  const handleLoginClick = () => {
    toggleCarrito();
    navigate("/login");
  };

  const handleRegistroClick = () => {
    toggleCarrito();
    navigate("/registro");
  };

  const handleCerrarMensaje = () => {
    console.log("🔄 Cerrando mensaje de pedido");
    limpiarMensaje();
    setPedidoId(null);
    localStorage.removeItem("last_pedido_id");
    localStorage.removeItem("last_pedido_timestamp");
  };

  const handleVaciarCarrito = () => {
    if (pedidoId) {
      const confirmar = window.confirm(
        "⚠️ Tienes un pedido en proceso de pago.\n\n" +
          "¿Seguro que quieres vaciar el carrito?\n" +
          "Se perderá el pedido actual y deberás crearlo nuevamente.",
      );

      if (!confirmar) return;

      // Limpiar todo
      setPedidoId(null);
      localStorage.removeItem("last_pedido_id");
      localStorage.removeItem("last_pedido_timestamp");
      localStorage.removeItem("payment_in_progress");
      limpiarMensaje();
    } else {
      const confirmar = window.confirm(
        "¿Estás seguro que deseas vaciar el carrito?",
      );

      if (!confirmar) return;
    }

    vaciarCarrito();
    console.log("🧹 Carrito vaciado");
  };

  // ✅ Calcular si hay items con stock insuficiente
  const hayItemsSinStock = items.some(
    (item) =>
      item.cantidad > item.instrumento.stock || item.instrumento.stock === 0,
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="flex-1 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={toggleCarrito}
      ></div>

      {/* Drawer */}
      <div className="w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-musical-slate to-musical-teal px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🛒</span>
            <h2 className="text-xl font-bold text-white">Carrito de Compras</h2>
          </div>
          <button
            className="w-8 h-8 text-white/80 hover:text-white hover:bg-white/10 rounded-full flex items-center justify-center transition-all duration-200 text-2xl"
            onClick={toggleCarrito}
            aria-label="Cerrar carrito"
          >
            ×
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Loading */}
          {loading && (
            <div className="p-6">
              <Loading message="Procesando pedido..." />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="m-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-red-600">
                <span>❌</span>
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Mensaje de éxito con botón de pago */}
          {mensajePedido && pedidoId && !loading && (
            <div className="m-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-600 mb-4">
                  <span>✅</span>
                  <p className="text-sm font-medium">{mensajePedido}</p>
                </div>

                <div className="space-y-3">
                  <MercadoPagoButton
                    pedidoId={pedidoId}
                    estadoPedido={estadoPedido}
                    onPaymentCreated={handlePaymentCreated}
                    onPaymentError={handlePaymentError}
                  />

                  <button
                    onClick={handleCerrarMensaje}
                    className="w-full bg-white text-musical-slate border-2 border-musical-slate hover:bg-musical-slate hover:text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200"
                  >
                    Cerrar y mantener pedido
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Carrito vacío */}
          {!loading && !mensajePedido && items.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center max-w-xs">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-bold text-musical-slate mb-2">
                  Tu carrito está vacío
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Explora nuestros productos y agrega lo que te guste
                </p>
              </div>
            </div>
          )}

          {/* Lista de items */}
          {!loading && !mensajePedido && items.length > 0 && (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {items.map((item) => (
                  <CarritoItem
                    key={item.instrumento.idInstrumento}
                    item={item}
                  />
                ))}
              </div>

              {/* Footer con resumen y acciones */}
              <div className="border-t border-slate-200 p-6 space-y-4 bg-slate-50">
                {/* Resumen */}
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">
                      Total ({totalItems} {totalItems === 1 ? "ítem" : "ítems"})
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-musical-slate">
                    ${totalPrecio.toLocaleString("es-AR")}
                  </div>
                </div>

                {/* Advertencia de stock */}
                {hayItemsSinStock && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2 text-red-600 text-sm">
                      <span className="flex-shrink-0">⚠️</span>
                      <span>
                        Algunos productos tienen stock insuficiente. Ajusta las
                        cantidades antes de continuar.
                      </span>
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="space-y-3">
                  <button
                    className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-200 ${
                      loading || hayItemsSinStock || !isAuthenticated
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-musical-teal to-musical-slate text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-4 focus:ring-musical-teal/20"
                    }`}
                    onClick={handleGuardarPedido}
                    disabled={loading || hayItemsSinStock || !isAuthenticated}
                    title={
                      !isAuthenticated
                        ? "Debes iniciar sesión para realizar un pedido"
                        : hayItemsSinStock
                          ? "Ajusta las cantidades antes de continuar"
                          : "Confirmar pedido"
                    }
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <span>🛍️</span>
                      <span>
                        {isAuthenticated
                          ? "Confirmar Pedido"
                          : "Realizar Pedido"}
                      </span>
                    </span>
                  </button>

                  <button
                    className="w-full bg-white text-slate-600 border-2 border-slate-200 hover:border-red-300 hover:text-red-600 py-3 px-4 rounded-lg font-semibold transition-all duration-200"
                    onClick={handleVaciarCarrito}
                    disabled={loading}
                  >
                    <span className="flex items-center justify-center space-x-2">
                      <span>🗑️</span>
                      <span>Vaciar carrito</span>
                    </span>
                  </button>
                </div>

                {/* Mensaje para usuarios no autenticados */}
                {!isAuthenticated && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-2 text-blue-600 text-sm">
                      <span>ℹ️</span>
                      <span>
                        Para realizar el pedido debes iniciar sesión o
                        registrarte
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="flex-1 bg-musical-teal text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-musical-slate transition-colors duration-200"
                        onClick={handleLoginClick}
                      >
                        Iniciar Sesión
                      </button>
                      <button
                        className="flex-1 bg-white text-musical-teal border-2 border-musical-teal hover:bg-musical-teal hover:text-white py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200"
                        onClick={handleRegistroClick}
                      >
                        Registrarse
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarritoDrawer;
