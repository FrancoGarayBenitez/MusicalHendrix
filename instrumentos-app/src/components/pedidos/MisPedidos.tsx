import React, { useState, useEffect } from "react";
import {
  Pedido,
  DetallePedido,
  EstadoPedido,
  getEstadoTexto,
} from "../../types/pedido";
import { fetchPedidosByUsuario } from "../../service/api";
import { useAuth } from "../../context/AuthContext";
import Loading from "../common/Loading";
import Error from "../common/Error";
import MercadoPagoButton from "../pagos/MercadoPagoButton";
import { Link } from "react-router-dom";

const MisPedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPedidoId, setExpandedPedidoId] = useState<number | null>(null);

  const { user } = useAuth();

  // ✅ Función para obtener la URL correcta de la imagen
  const getImageUrl = (imagen: string): string => {
    const API_URL = "http://localhost:8080/api";

    if (!imagen) return "/images/placeholder.jpg";

    // Si la imagen fue subida por el admin (nombre con timestamp)
    if (/^\d{10,}_/.test(imagen)) {
      return `${API_URL}/uploads/images/${imagen}`;
    }

    // Si es una imagen de la carpeta pública del frontend (seeder)
    return `/images/${imagen}`;
  };

  useEffect(() => {
    const loadPedidos = async () => {
      if (!user || !user.id) {
        console.warn("⚠️ Usuario no identificado");
        setError("No se ha podido identificar al usuario");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("📥 Cargando pedidos del usuario:", user.id);

        const misPedidos = await fetchPedidosByUsuario(user.id);

        console.log("✅ Pedidos cargados:", misPedidos.length);
        setPedidos(misPedidos);
      } catch (err) {
        console.error("❌ Error al cargar pedidos:", err);
        setError("Error al cargar los pedidos. Por favor, intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    loadPedidos();
  }, [user]);

  const toggleExpandPedido = (pedidoId: number): void => {
    if (expandedPedidoId === pedidoId) {
      setExpandedPedidoId(null);
      console.log("📂 Cerrando pedido:", pedidoId);
    } else {
      setExpandedPedidoId(pedidoId);
      console.log("📂 Expandiendo pedido:", pedidoId);
    }
  };

  const formatDate = (dateString?: Date | string | null): string => {
    if (!dateString) return "Fecha no disponible";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("❌ Error al formatear fecha:", error);
      return "Fecha inválida";
    }
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // ✅ Función para obtener color del badge de estado
  const getStatusBadgeClass = (estado: EstadoPedido) => {
    switch (estado) {
      case EstadoPedido.PENDIENTE_PAGO:
        return "bg-musical-warning text-white";
      case EstadoPedido.PAGADO:
        return "bg-blue-500 text-white";
      case EstadoPedido.ENVIADO:
        return "bg-purple-500 text-white";
      case EstadoPedido.ENTREGADO:
        return "bg-musical-success text-white";
      case EstadoPedido.CANCELADO:
        return "bg-red-500 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  if (loading) return <Loading message="Cargando tus pedidos..." />;
  if (error) return <Error message={error} />;

  if (pedidos.length === 0) {
    return (
      <div className="relative">
        {/* Background con gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-musical-teal/5 to-musical-slate/10 rounded-2xl"></div>

        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-16 text-center border border-slate-200/50">
          <div className="max-w-md mx-auto">
            {/* Icono con fondo decorativo */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-musical-teal/20 to-musical-slate/20 rounded-full blur-3xl transform scale-150"></div>
              <div className="relative text-8xl">📦</div>
            </div>

            <h3 className="text-3xl font-bold text-musical-slate mb-6 leading-tight">
              No tienes pedidos realizados aún
            </h3>

            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              Cuando realices tu primera compra, podrás ver el historial
              completo aquí
            </p>

            <Link
              to="/productos"
              className="inline-flex items-center bg-gradient-to-r from-musical-slate to-musical-teal text-white font-bold px-10 py-5 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 space-x-3 text-xl group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">
                🛍️
              </span>
              <span>Ver productos disponibles</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lista de pedidos */}
      <div className="space-y-4">
        {pedidos.map((pedido) => {
          if (!pedido.id) {
            console.error("❌ Pedido sin ID:", pedido);
            return null;
          }

          const isExpanded = expandedPedidoId === pedido.id;
          const estadoPedido = pedido.estado || EstadoPedido.PENDIENTE_PAGO;

          return (
            <div
              key={pedido.id}
              className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-xl"
            >
              {/* Header del pedido */}
              <div
                className="p-6 cursor-pointer hover:bg-slate-50 transition-colors duration-200"
                onClick={() => toggleExpandPedido(pedido.id)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    toggleExpandPedido(pedido.id);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  {/* Info básica */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-bold text-musical-slate">
                        Pedido #{pedido.id}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(estadoPedido)}`}
                      >
                        {getEstadoTexto(estadoPedido)}
                      </span>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-slate-600">
                      <span className="flex items-center space-x-1">
                        <span>📅</span>
                        <span>{formatDate(pedido.fecha)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <span>💰</span>
                        <span className="font-semibold">
                          ${formatPrice(pedido.total || 0)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Icono expandir/contraer */}
                  <div className="ml-4">
                    <div
                      className={`w-8 h-8 bg-musical-teal/10 text-musical-teal rounded-lg flex items-center justify-center transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <span>▼</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalles del pedido */}
              {isExpanded && (
                <div className="border-t border-slate-200">
                  <div className="p-6 space-y-6">
                    {/* Productos */}
                    <div>
                      <h4 className="text-lg font-semibold text-musical-slate mb-4 flex items-center">
                        <span className="mr-2">🎵</span>
                        Productos en este pedido
                      </h4>

                      <div className="space-y-4">
                        {pedido.detalles && pedido.detalles.length > 0 ? (
                          pedido.detalles.map(
                            (detalle: DetallePedido, index: number) => {
                              const instrumento = detalle.instrumento;

                              if (!instrumento) {
                                console.warn(
                                  "⚠️ Detalle sin instrumento:",
                                  detalle,
                                );
                                return (
                                  <div
                                    key={index}
                                    className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                                  >
                                    <div className="flex items-center space-x-2 text-slate-500">
                                      <span>⚠️</span>
                                      <span className="text-sm">
                                        Información del producto no disponible
                                      </span>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600">
                                      <p>Cantidad: {detalle.cantidad}</p>
                                      <p>
                                        Precio: $
                                        {formatPrice(detalle.precioUnitario)}
                                      </p>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={index}
                                  className="bg-slate-50 rounded-lg p-4 border border-slate-200"
                                >
                                  <div className="flex items-start space-x-4">
                                    {/* Imagen */}
                                    <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                                      <img
                                        src={getImageUrl(instrumento.imagen)}
                                        alt={instrumento.denominacion}
                                        onError={(e) => {
                                          console.error(
                                            "❌ Error al cargar imagen:",
                                            instrumento.imagen,
                                          );
                                          e.currentTarget.src =
                                            "/images/placeholder.jpg";
                                        }}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>

                                    {/* Info del instrumento */}
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-bold text-musical-slate mb-1 line-clamp-1">
                                        {instrumento.denominacion}
                                      </h5>
                                      <div className="space-y-1 text-sm text-slate-600">
                                        <p>
                                          <span className="font-medium">
                                            Marca:
                                          </span>{" "}
                                          {instrumento.marca}
                                        </p>
                                        <p>
                                          <span className="font-medium">
                                            Categoría:
                                          </span>{" "}
                                          {instrumento.categoriaInstrumento
                                            ?.denominacion || "Sin categoría"}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Precio y cantidad */}
                                    <div className="text-right flex-shrink-0">
                                      <p className="text-lg font-bold text-musical-slate">
                                        ${formatPrice(detalle.precioUnitario)}
                                      </p>
                                      <p className="text-sm text-slate-600">
                                        Cantidad: {detalle.cantidad}
                                      </p>
                                      <p className="text-sm font-semibold text-musical-teal">
                                        Subtotal: $
                                        {formatPrice(
                                          detalle.precioUnitario *
                                            detalle.cantidad,
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            },
                          )
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                            <span className="text-red-600 text-sm">
                              ⚠️ No hay productos en este pedido
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Resumen del pedido */}
                    <div className="bg-gradient-to-r from-musical-teal/10 to-musical-slate/10 rounded-lg p-4 border-2 border-dashed border-musical-teal/30">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-musical-slate">
                          Total del Pedido:
                        </span>
                        <span className="text-2xl font-bold text-musical-slate">
                          ${formatPrice(pedido.total || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Sección de pago y estados */}
                    <div className="space-y-4">
                      {/* Botón de pago para pendientes */}
                      {estadoPedido === EstadoPedido.PENDIENTE_PAGO && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 text-yellow-600 mb-3">
                            <span>⏳</span>
                            <span className="font-medium">
                              Este pedido está pendiente de pago
                            </span>
                          </div>
                          <MercadoPagoButton
                            pedidoId={pedido.id}
                            estadoPedido={estadoPedido}
                            onPaymentCreated={() => {
                              console.log(
                                "💳 Pago iniciado para pedido:",
                                pedido.id,
                              );
                            }}
                            onPaymentError={(error) => {
                              console.error("❌ Error en pago:", error);
                              alert(`Error al procesar el pago: ${error}`);
                            }}
                          />
                        </div>
                      )}

                      {/* Mensajes de estado */}
                      {estadoPedido === EstadoPedido.PAGADO && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center space-x-2 text-blue-600">
                            <span className="text-xl">✅</span>
                            <span className="font-medium">
                              Pago confirmado. Tu pedido está siendo procesado.
                            </span>
                          </div>
                        </div>
                      )}

                      {estadoPedido === EstadoPedido.ENVIADO && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center space-x-2 text-purple-600">
                            <span className="text-xl">📦</span>
                            <span className="font-medium">
                              Tu pedido está en camino.
                            </span>
                          </div>
                        </div>
                      )}

                      {estadoPedido === EstadoPedido.ENTREGADO && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center space-x-2 text-green-600">
                            <span className="text-xl">🎉</span>
                            <span className="font-medium">
                              Pedido entregado. ¡Gracias por tu compra!
                            </span>
                          </div>
                        </div>
                      )}

                      {estadoPedido === EstadoPedido.CANCELADO && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                          <div className="flex items-center justify-center space-x-2 text-red-600">
                            <span className="text-xl">❌</span>
                            <span className="font-medium">
                              Este pedido ha sido cancelado.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Acciones adicionales */}
      <div className="mt-12 text-center">
        <div className="relative">
          {/* Background decorativo */}
          <div className="absolute inset-0 bg-gradient-to-r from-musical-teal/10 to-musical-slate/10 rounded-2xl"></div>

          <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-10 border border-slate-200/50">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-r from-musical-teal to-musical-slate rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🎵</span>
              </div>

              <h3 className="text-2xl font-bold text-musical-slate mb-4">
                ¿Buscas algo más?
              </h3>

              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Explora nuestro catálogo completo de instrumentos musicales
              </p>

              <Link
                to="/productos"
                className="inline-flex items-center bg-gradient-to-r from-musical-slate to-musical-teal text-white font-bold px-10 py-5 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 space-x-3 text-xl group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  🛍️
                </span>
                <span>Ver más productos</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MisPedidos;
