import React, { useState, useEffect } from "react";
import {
  Pedido,
  EstadoPedido,
  getEstadoTexto,
  getEstadoClass,
} from "../types/pedido";
import { fetchPedidos, updatePedidoEstado } from "../service/api";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import Loading from "../components/common/Loading";
import Error from "../components/common/Error";
import "./AdminStyles.css";

const GestionPedidosPage: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPedidoId, setExpandedPedidoId] = useState<number | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [filterUsuario, setFilterUsuario] = useState<string>("");
  const [sortBy, setSortBy] = useState<"fecha" | "total" | "estado">("fecha");
  const [updatingEstado, setUpdatingEstado] = useState<number | null>(null);

  const { user, isAuthenticated, isAdmin } = useAuth();

  // ✅ PROTECCIÓN: Solo admin puede acceder
  if (!isAuthenticated) {
    console.warn("⚠️ Usuario no autenticado. Redirigiendo a login...");
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    console.warn("⚠️ Usuario sin permisos de admin. Redirigiendo a home...");
    return <Navigate to="/" replace />;
  }

  if (!user?.activo) {
    console.warn("⚠️ Usuario inactivo. Redirigiendo a login...");
    return <Navigate to="/login" replace />;
  }

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

  const loadPedidos = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📥 Cargando todos los pedidos (admin)...");

      // ✅ El backend ya devuelve pedidos completos con usuario e instrumentos
      // PedidoResponseDTO incluye:
      // - UsuarioResponseDTO (con nombre, apellido, rol)
      // - List<DetallePedidoResponseDTO> (con InstrumentoDTO completo)
      const allPedidos = await fetchPedidos();

      console.log("✅ Pedidos cargados:", allPedidos.length);
      setPedidos(allPedidos);
    } catch (err) {
      console.error("❌ Error al cargar pedidos:", err);
      setError("Error al cargar los pedidos. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPedidos();
  }, []);

  const toggleExpandPedido = (pedidoId: number): void => {
    setExpandedPedidoId(expandedPedidoId === pedidoId ? null : pedidoId);
    console.log(
      expandedPedidoId === pedidoId
        ? "📂 Cerrando pedido:"
        : "📂 Expandiendo pedido:",
      pedidoId,
    );
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

  const handleCambiarEstado = async (pedidoId: number, nuevoEstado: string) => {
    if (updatingEstado) {
      console.warn("⚠️ Ya hay un estado actualizándose");
      return;
    }

    const confirmacion = window.confirm(
      `¿Estás seguro de cambiar el estado a "${getEstadoTexto(nuevoEstado)}"?`,
    );

    if (!confirmacion) {
      console.log("🚫 Cambio de estado cancelado por el usuario");
      return;
    }

    try {
      setUpdatingEstado(pedidoId);
      console.log(
        `🔄 Actualizando estado del pedido ${pedidoId} → ${nuevoEstado}`,
      );

      await updatePedidoEstado(pedidoId, nuevoEstado);

      console.log("✅ Estado actualizado correctamente");

      // ✅ Recargar pedidos para ver los cambios
      await loadPedidos();

      alert(
        `✅ Estado actualizado correctamente a: ${getEstadoTexto(nuevoEstado)}`,
      );
    } catch (err) {
      console.error("❌ Error al cambiar estado:", err);
      alert(
        "❌ Error al cambiar el estado del pedido. Por favor, inténtalo nuevamente.",
      );
    } finally {
      setUpdatingEstado(null);
    }
  };

  // ✅ Filtrado de pedidos
  const filteredPedidos = pedidos
    .filter((pedido) => {
      if (!pedido.fecha) return false;

      const pedidoDate = new Date(pedido.fecha);

      // Filtro por fecha desde
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (pedidoDate < fromDate) return false;
      }

      // Filtro por fecha hasta
      if (filterDateTo) {
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (pedidoDate > toDate) return false;
      }

      // Filtro por estado
      if (filterEstado && pedido.estado !== filterEstado) {
        return false;
      }

      // Filtro por usuario (nombre o apellido)
      if (filterUsuario && pedido.usuario) {
        const nombreCompleto =
          `${pedido.usuario.nombre} ${pedido.usuario.apellido}`.toLowerCase();
        const email = pedido.usuario.email.toLowerCase();
        const searchTerm = filterUsuario.toLowerCase();

        if (
          !nombreCompleto.includes(searchTerm) &&
          !email.includes(searchTerm)
        ) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "fecha":
          return (
            new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime()
          );
        case "total":
          return (b.total || 0) - (a.total || 0);
        case "estado":
          return (a.estado || "").localeCompare(b.estado || "");
        default:
          return 0;
      }
    });

  // ✅ Estadísticas calculadas
  const estadisticas = {
    total: filteredPedidos.length,
    pendientesPago: filteredPedidos.filter(
      (p) => p.estado === EstadoPedido.PENDIENTE_PAGO,
    ).length,
    pagados: filteredPedidos.filter((p) => p.estado === EstadoPedido.PAGADO)
      .length,
    enviados: filteredPedidos.filter((p) => p.estado === EstadoPedido.ENVIADO)
      .length,
    entregados: filteredPedidos.filter(
      (p) => p.estado === EstadoPedido.ENTREGADO,
    ).length,
    cancelados: filteredPedidos.filter(
      (p) => p.estado === EstadoPedido.CANCELADO,
    ).length,
    totalVentas: filteredPedidos
      .filter(
        (p) =>
          p.estado === EstadoPedido.PAGADO ||
          p.estado === EstadoPedido.ENVIADO ||
          p.estado === EstadoPedido.ENTREGADO,
      )
      .reduce((sum, p) => sum + (p.total || 0), 0),
  };

  const clearFilters = () => {
    console.log("🧹 Limpiando filtros");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterEstado("");
    setFilterUsuario("");
    setSortBy("fecha");
  };

  if (loading) return <Loading message="Cargando pedidos..." />;
  if (error) return <Error message={error} />;

  return (
    <div className="admin-page">
      {/* Header de la página */}
      <div className="page-header">
        <h1>📦 Gestión de Pedidos</h1>
        <p>Administración de todos los pedidos realizados</p>
        <div className="admin-info">
          <span className="admin-user">
            👤 {user.email} <span className="role-badge admin">ADMIN</span>
          </span>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-container">
        <div className="stat-card">
          <span className="stat-value">{estadisticas.total}</span>
          <span className="stat-label">Total Pedidos</span>
        </div>
        <div className="stat-card warning">
          <span className="stat-value">{estadisticas.pendientesPago}</span>
          <span className="stat-label">Pendientes Pago</span>
        </div>
        <div className="stat-card success">
          <span className="stat-value">{estadisticas.pagados}</span>
          <span className="stat-label">Pagados</span>
        </div>
        <div className="stat-card info">
          <span className="stat-value">{estadisticas.enviados}</span>
          <span className="stat-label">Enviados</span>
        </div>
        <div className="stat-card success">
          <span className="stat-value">{estadisticas.entregados}</span>
          <span className="stat-label">Entregados</span>
        </div>
        <div className="stat-card highlight">
          <span className="stat-value">
            ${formatPrice(estadisticas.totalVentas)}
          </span>
          <span className="stat-label">Total Ventas</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="filter-container">
        <div className="date-filters">
          <div className="filter-group">
            <label htmlFor="date-from">Desde:</label>
            <input
              type="date"
              id="date-from"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label htmlFor="date-to">Hasta:</label>
            <input
              type="date"
              id="date-to"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-estado">Estado:</label>
          <select
            id="filter-estado"
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="">Todos</option>
            <option value={EstadoPedido.PENDIENTE_PAGO}>
              Pendiente de Pago
            </option>
            <option value={EstadoPedido.PAGADO}>Pagado</option>
            <option value={EstadoPedido.ENVIADO}>Enviado</option>
            <option value={EstadoPedido.ENTREGADO}>Entregado</option>
            <option value={EstadoPedido.CANCELADO}>Cancelado</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-usuario">Cliente:</label>
          <input
            type="text"
            id="filter-usuario"
            placeholder="Buscar por nombre o email..."
            value={filterUsuario}
            onChange={(e) => setFilterUsuario(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="sort-by">Ordenar por:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "fecha" | "total" | "estado")
            }
          >
            <option value="fecha">Fecha (más reciente)</option>
            <option value="total">Total (mayor a menor)</option>
            <option value="estado">Estado (A-Z)</option>
          </select>
        </div>

        <div className="filter-group">
          <button onClick={clearFilters} className="btn-clear-filters">
            🧹 Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Lista de pedidos */}
      {filteredPedidos.length === 0 ? (
        <div className="no-data">
          <p>📭 No hay pedidos para mostrar con los filtros actuales.</p>
          {(filterDateFrom ||
            filterDateTo ||
            filterEstado ||
            filterUsuario) && (
            <button onClick={clearFilters} className="btn-secondary">
              Ver todos los pedidos
            </button>
          )}
        </div>
      ) : (
        <div className="pedidos-list">
          {filteredPedidos.map((pedido) => {
            if (!pedido.id) {
              console.error("❌ Pedido sin ID:", pedido);
              return null;
            }

            const isExpanded = expandedPedidoId === pedido.id;
            const nombreCompleto = pedido.usuario
              ? `${pedido.usuario.nombre} ${pedido.usuario.apellido}`
              : "Usuario Desconocido";

            return (
              <div
                key={pedido.id}
                className={`pedido-card admin-pedido ${isExpanded ? "expanded" : ""}`}
              >
                {/* Header del pedido */}
                <div
                  className="pedido-header"
                  onClick={() => toggleExpandPedido(pedido.id)}
                >
                  <div className="pedido-basic-info">
                    <span className="pedido-id">Pedido #{pedido.id}</span>
                    <span className="pedido-date">
                      {formatDate(pedido.fecha)}
                    </span>
                  </div>

                  <div className="pedido-user-info">
                    <span className="pedido-user">👤 {nombreCompleto}</span>
                    {pedido.usuario?.email && (
                      <span className="pedido-user-email">
                        ({pedido.usuario.email})
                      </span>
                    )}
                  </div>

                  <div className="pedido-status-price">
                    <span
                      className={`pedido-status status-${getEstadoClass(pedido.estado || EstadoPedido.PENDIENTE_PAGO)}`}
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
                        pedido.detalles.map((detalle, index) => {
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
                                <p className="item-brand-code">
                                  <strong>Marca:</strong> {instrumento.marca} |{" "}
                                  <strong>ID:</strong>{" "}
                                  {instrumento.idInstrumento}
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
                        })
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

                    {/* Acciones de administración */}
                    <div className="pedido-actions">
                      <label htmlFor={`estado-${pedido.id}`}>
                        Cambiar estado del pedido:
                      </label>
                      <select
                        id={`estado-${pedido.id}`}
                        value={pedido.estado || EstadoPedido.PENDIENTE_PAGO}
                        onChange={(e) =>
                          handleCambiarEstado(pedido.id, e.target.value)
                        }
                        disabled={updatingEstado === pedido.id}
                        className={
                          updatingEstado === pedido.id ? "updating" : ""
                        }
                      >
                        <option value={EstadoPedido.PENDIENTE_PAGO}>
                          Pendiente de Pago
                        </option>
                        <option value={EstadoPedido.PAGADO}>Pagado</option>
                        <option value={EstadoPedido.ENVIADO}>Enviado</option>
                        <option value={EstadoPedido.ENTREGADO}>
                          Entregado
                        </option>
                        <option value={EstadoPedido.CANCELADO}>
                          Cancelado
                        </option>
                      </select>
                      {updatingEstado === pedido.id && (
                        <span className="updating-indicator">
                          ⏳ Actualizando...
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GestionPedidosPage;
