import React, { useState, useEffect } from "react";
import {
  Pedido,
  DetallePedido, // ✅ AGREGADO
  EstadoPedido,
  getEstadoTexto,
  getEstadoClass,
} from "../../types/pedido";
import { fetchPedidosByUsuario } from "../../service/api";
import { useAuth } from "../../context/AuthContext";
import Loading from "../common/Loading";
import Error from "../common/Error";
import MercadoPagoButton from "../pagos/MercadoPagoButton";
import "./MisPedidos.css";

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

        // ✅ El backend ya devuelve pedidos con detalles completos
        // PedidoResponseDTO incluye List<DetallePedidoResponseDTO>
        // DetallePedidoResponseDTO incluye InstrumentoDTO completo
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

  if (loading) return <Loading message="Cargando tus pedidos..." />;
  if (error) return <Error message={error} />;

  if (pedidos.length === 0) {
    return (
      <div className="mis-pedidos-container">
        <h2>Mis Pedidos</h2>
        <div className="no-pedidos">
          <p>📦 No tienes pedidos realizados aún.</p>
          <p>
            <a href="/productos" className="link">
              Ver productos disponibles
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mis-pedidos-container">
      <h2>Mis Pedidos ({pedidos.length})</h2>

      <div className="pedidos-list">
        {pedidos.map((pedido) => {
          // ✅ Validar que el pedido tenga ID
          if (!pedido.id) {
            console.error("❌ Pedido sin ID:", pedido);
            return null;
          }

          const isExpanded = expandedPedidoId === pedido.id;

          return (
            <div
              key={pedido.id}
              className={`pedido-card ${isExpanded ? "expanded" : ""}`}
            >
              {/* Header del pedido */}
              <div
                className="pedido-header"
                onClick={() => toggleExpandPedido(pedido.id)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    toggleExpandPedido(pedido.id);
                  }
                }}
              >
                <div className="pedido-basic-info">
                  <span className="pedido-id">Pedido #{pedido.id}</span>
                  <span className="pedido-date">
                    {formatDate(pedido.fecha)}
                  </span>
                </div>

                <div className="pedido-status-price">
                  <span
                    className={`pedido-status status-${getEstadoClass(
                      pedido.estado || EstadoPedido.PENDIENTE_PAGO,
                    )}`}
                  >
                    {getEstadoTexto(
                      pedido.estado || EstadoPedido.PENDIENTE_PAGO,
                    )}
                  </span>
                  <span className="pedido-total">
                    ${formatPrice(pedido.total || 0)}
                  </span>
                </div>

                <div
                  className="pedido-expand-icon"
                  aria-label={isExpanded ? "Contraer" : "Expandir"}
                >
                  {isExpanded ? "▲" : "▼"}
                </div>
              </div>

              {/* Detalles del pedido */}
              {isExpanded && (
                <div className="pedido-details">
                  <h4>Productos en este pedido</h4>

                  <div className="pedido-items">
                    {pedido.detalles && pedido.detalles.length > 0 ? (
                      pedido.detalles.map(
                        (detalle: DetallePedido, index: number) => {
                          // ✅ TIPOS EXPLÍCITOS
                          // El backend ya envía el instrumento completo en cada detalle
                          const instrumento = detalle.instrumento;

                          if (!instrumento) {
                            console.warn(
                              "⚠️ Detalle sin instrumento:",
                              detalle,
                            );
                            return (
                              <div key={index} className="pedido-item">
                                <div className="item-basic-info">
                                  <p>
                                    ⚠️ Información del producto no disponible
                                  </p>
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
                            <div key={index} className="pedido-item">
                              {/* Imagen del instrumento */}
                              <div className="item-image">
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
                                />
                              </div>

                              {/* Info del instrumento */}
                              <div className="item-info">
                                <h5>{instrumento.denominacion}</h5>
                                <p className="item-brand-model">
                                  <strong>Marca:</strong> {instrumento.marca}
                                </p>
                                <p className="item-category">
                                  <strong>Categoría:</strong>{" "}
                                  {instrumento.categoriaInstrumento
                                    ?.denominacion || "Sin categoría"}
                                </p>
                              </div>

                              {/* Precio y cantidad */}
                              <div className="item-price">
                                <p className="price">
                                  ${formatPrice(detalle.precioUnitario)}
                                </p>
                                <p className="quantity">
                                  Cantidad: {detalle.cantidad}
                                </p>
                                <p className="subtotal">
                                  Subtotal: $
                                  {formatPrice(
                                    detalle.precioUnitario * detalle.cantidad,
                                  )}
                                </p>
                              </div>
                            </div>
                          );
                        },
                      )
                    ) : (
                      <div className="no-items">
                        <p>⚠️ No hay productos en este pedido</p>
                      </div>
                    )}
                  </div>

                  {/* Resumen del pedido */}
                  <div className="pedido-summary">
                    <div className="summary-row">
                      <span>Total del Pedido:</span>
                      <span className="total-price">
                        ${formatPrice(pedido.total || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Sección de pago */}
                  {pedido.estado === EstadoPedido.PENDIENTE_PAGO && (
                    <div className="pedido-payment-section">
                      <MercadoPagoButton
                        pedidoId={pedido.id}
                        estadoPedido={pedido.estado}
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
                  {pedido.estado === EstadoPedido.PAGADO && (
                    <div className="pedido-status-message pagado">
                      ✅ Pago confirmado. Tu pedido está siendo procesado.
                    </div>
                  )}

                  {pedido.estado === EstadoPedido.ENVIADO && (
                    <div className="pedido-status-message enviado">
                      📦 Tu pedido está en camino.
                    </div>
                  )}

                  {pedido.estado === EstadoPedido.ENTREGADO && (
                    <div className="pedido-status-message entregado">
                      ✅ Pedido entregado. ¡Gracias por tu compra!
                    </div>
                  )}

                  {pedido.estado === EstadoPedido.CANCELADO && (
                    <div className="pedido-status-message cancelado">
                      ❌ Este pedido ha sido cancelado.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MisPedidos;
