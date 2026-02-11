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
        setPedidoId(pedidoIdNumber); // ✅ Guardar como number
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
      const pedidoResponse = await guardarPedido(); // ✅ Retorna PedidoResponse | null

      if (pedidoResponse && pedidoResponse.id) {
        // ✅ CORREGIDO: Usar 'id' en lugar de 'idPedido'
        const idPedido = pedidoResponse.id;
        console.log("🎉 Pedido guardado con ID:", idPedido);

        setPedidoId(idPedido); // ✅ Ahora es number
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
    <div className="carrito-drawer-container">
      <div className="carrito-drawer-overlay" onClick={toggleCarrito}></div>

      <div className="carrito-drawer">
        {/* Header */}
        <div className="carrito-header">
          <h2>Carrito de Compras</h2>
          <button
            className="close-btn"
            onClick={toggleCarrito}
            aria-label="Cerrar carrito"
          >
            ×
          </button>
        </div>

        {/* Loading */}
        {loading && <Loading message="Procesando pedido..." />}

        {/* Error */}
        {error && !loading && (
          <div className="mensaje-error">
            <p>❌ {error}</p>
          </div>
        )}

        {/* Mensaje de éxito con botón de pago */}
        {mensajePedido && pedidoId && !loading && (
          <div className="mensaje-exito">
            <p>✅ {mensajePedido}</p>

            <div className="payment-button-container">
              <MercadoPagoButton
                pedidoId={pedidoId} // ✅ Ahora es number
                estadoPedido={estadoPedido}
                onPaymentCreated={handlePaymentCreated}
                onPaymentError={handlePaymentError}
              />
            </div>

            <button
              onClick={handleCerrarMensaje}
              className="btn-cerrar-mensaje"
            >
              Cerrar y mantener pedido
            </button>
          </div>
        )}

        {/* Carrito vacío */}
        {!loading && !mensajePedido && items.length === 0 && (
          <div className="carrito-vacio">
            <p>🛒 Tu carrito está vacío</p>
            <p className="carrito-vacio-subtitle">
              Explora nuestros productos y agrega lo que te guste
            </p>
          </div>
        )}

        {/* Lista de items */}
        {!loading && !mensajePedido && items.length > 0 && (
          <>
            <div className="carrito-items">
              {items.map((item) => (
                <CarritoItem key={item.instrumento.idInstrumento} item={item} />
              ))}
            </div>

            {/* Resumen */}
            <div className="carrito-summary">
              <p className="total-items">
                Total: ({totalItems} {totalItems === 1 ? "ítem" : "ítems"})
              </p>
              <p className="total-price">${totalPrecio.toLocaleString()}</p>
            </div>

            {/* Advertencia de stock */}
            {hayItemsSinStock && (
              <div className="mensaje-error" style={{ margin: "0 1.5rem" }}>
                <p>
                  ⚠️ Algunos productos tienen stock insuficiente. Ajusta las
                  cantidades antes de continuar.
                </p>
              </div>
            )}

            {/* Acciones */}
            <div className="carrito-actions">
              <button
                className="btn-vaciar"
                onClick={handleVaciarCarrito}
                disabled={loading}
              >
                Vaciar carrito
              </button>

              <button
                className="btn-guardar"
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
                {isAuthenticated ? "Confirmar Pedido" : "Realizar Pedido"}
              </button>
            </div>

            {/* Mensaje para usuarios no autenticados */}
            {!isAuthenticated && (
              <div className="auth-message">
                <p>
                  ℹ️ Para realizar el pedido debes iniciar sesión o registrarte
                </p>
                <div className="auth-buttons">
                  <button className="btn-auth login" onClick={handleLoginClick}>
                    Iniciar Sesión
                  </button>
                  <button
                    className="btn-auth register"
                    onClick={handleRegistroClick}
                  >
                    Registrarse
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CarritoDrawer;
