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
    <div className="min-h-screen bg-slate-50">
      {/* Header de la página */}
      <div className="bg-gradient-to-r from-musical-slate via-musical-teal to-musical-slate py-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-6 left-10 w-24 h-24 bg-white rounded-full blur-2xl"></div>
          <div className="absolute bottom-6 right-10 w-20 h-20 bg-white rounded-full blur-2xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-3xl">📦</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                  Gestión de Pedidos
                </h1>
                <p className="text-white/80 text-lg">
                  Administración de todos los pedidos realizados
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                <div className="flex items-center space-x-2 text-white">
                  <span className="text-sm">👤</span>
                  <span className="font-medium">{user.email}</span>
                  <span className="bg-emerald-400 text-emerald-900 px-3 py-1 rounded-lg text-xs font-bold">
                    ADMIN
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-musical-slate mb-2">
                {estadisticas.total}
              </div>
              <div className="text-sm text-slate-600 font-medium">
                Total Pedidos
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-amber-200 bg-gradient-to-br from-amber-50 to-white">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600 mb-2">
                {estadisticas.pendientesPago}
              </div>
              <div className="text-sm text-amber-700 font-medium">
                Pendientes Pago
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                {estadisticas.pagados}
              </div>
              <div className="text-sm text-emerald-700 font-medium">
                Pagados
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {estadisticas.enviados}
              </div>
              <div className="text-sm text-blue-700 font-medium">Enviados</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-green-200 bg-gradient-to-br from-green-50 to-white">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {estadisticas.entregados}
              </div>
              <div className="text-sm text-green-700 font-medium">
                Entregados
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-musical-teal bg-gradient-to-br from-musical-teal/10 to-white">
            <div className="text-center">
              <div className="text-2xl font-bold text-musical-teal mb-2">
                ${formatPrice(estadisticas.totalVentas)}
              </div>
              <div className="text-sm text-musical-slate font-medium">
                Total Ventas
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 space-y-6">
          <h3 className="text-xl font-bold text-musical-slate mb-4 flex items-center">
            <span className="mr-2">🔍</span>
            Filtros de Búsqueda
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Filtros de fecha */}
            <div className="space-y-2">
              <label
                htmlFor="date-from"
                className="block text-sm font-medium text-slate-700"
              >
                Desde:
              </label>
              <input
                type="date"
                id="date-from"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-musical-teal focus:ring-2 focus:ring-musical-teal/20 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="date-to"
                className="block text-sm font-medium text-slate-700"
              >
                Hasta:
              </label>
              <input
                type="date"
                id="date-to"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-musical-teal focus:ring-2 focus:ring-musical-teal/20 transition-all duration-200"
              />
            </div>

            {/* Filtro por estado */}
            <div className="space-y-2">
              <label
                htmlFor="filter-estado"
                className="block text-sm font-medium text-slate-700"
              >
                Estado:
              </label>
              <select
                id="filter-estado"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-musical-teal focus:ring-2 focus:ring-musical-teal/20 bg-white transition-all duration-200"
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

            {/* Filtro por usuario */}
            <div className="space-y-2">
              <label
                htmlFor="filter-usuario"
                className="block text-sm font-medium text-slate-700"
              >
                Cliente:
              </label>
              <input
                type="text"
                id="filter-usuario"
                placeholder="Buscar por nombre o email..."
                value={filterUsuario}
                onChange={(e) => setFilterUsuario(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-musical-teal focus:ring-2 focus:ring-musical-teal/20 transition-all duration-200"
              />
            </div>

            {/* Ordenar por */}
            <div className="space-y-2">
              <label
                htmlFor="sort-by"
                className="block text-sm font-medium text-slate-700"
              >
                Ordenar por:
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "fecha" | "total" | "estado")
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-musical-teal focus:ring-2 focus:ring-musical-teal/20 bg-white transition-all duration-200"
              >
                <option value="fecha">Fecha (más reciente)</option>
                <option value="total">Total (mayor a menor)</option>
                <option value="estado">Estado (A-Z)</option>
              </select>
            </div>

            {/* Botón limpiar */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-transparent">
                .
              </label>
              <button
                onClick={clearFilters}
                className="w-full inline-flex items-center justify-center px-4 py-2 bg-slate-100 text-musical-slate text-sm font-medium rounded-lg hover:bg-musical-teal hover:text-white transition-all duration-200 space-x-2"
              >
                <span>🧹</span>
                <span>Limpiar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Lista de pedidos */}
        {filteredPedidos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-musical-slate mb-3">
                No hay pedidos para mostrar
              </h3>
              <p className="text-slate-600 text-sm mb-4">
                No hay pedidos para mostrar con los filtros actuales.
              </p>
              {(filterDateFrom ||
                filterDateTo ||
                filterEstado ||
                filterUsuario) && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 bg-musical-teal text-white font-medium rounded-lg hover:bg-musical-slate transition-all duration-200 space-x-2"
                >
                  <span>🔄</span>
                  <span>Ver todos los pedidos</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
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
                  className={`bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-xl ${
                    isExpanded ? "ring-2 ring-musical-teal/50 shadow-2xl" : ""
                  }`}
                >
                  {/* Header del pedido */}
                  <div
                    className="p-6 cursor-pointer hover:bg-slate-50 transition-colors duration-200"
                    onClick={() => toggleExpandPedido(pedido.id)}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                      {/* Info básica del pedido */}
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-4">
                          <span className="text-lg font-bold text-musical-slate">
                            Pedido #{pedido.id}
                          </span>
                          <span className="text-sm text-slate-600">
                            {formatDate(pedido.fecha)}
                          </span>
                        </div>

                        {/* Info del usuario */}
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-slate-600">👤</span>
                          <span className="font-medium text-musical-slate">
                            {nombreCompleto}
                          </span>
                          {pedido.usuario?.email && (
                            <span className="text-slate-500">
                              ({pedido.usuario.email})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Estado y precio */}
                      <div className="flex items-center justify-between lg:justify-end lg:space-x-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            pedido.estado === EstadoPedido.PENDIENTE_PAGO
                              ? "bg-amber-100 text-amber-800"
                              : pedido.estado === EstadoPedido.PAGADO
                                ? "bg-emerald-100 text-emerald-800"
                                : pedido.estado === EstadoPedido.ENVIADO
                                  ? "bg-blue-100 text-blue-800"
                                  : pedido.estado === EstadoPedido.ENTREGADO
                                    ? "bg-green-100 text-green-800"
                                    : pedido.estado === EstadoPedido.CANCELADO
                                      ? "bg-red-100 text-red-800"
                                      : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {getEstadoTexto(
                            pedido.estado || EstadoPedido.PENDIENTE_PAGO,
                          )}
                        </span>

                        <div className="flex items-center space-x-3">
                          <span className="text-xl font-bold text-musical-teal">
                            ${formatPrice(pedido.total || 0)}
                          </span>

                          <div
                            className={`transform transition-transform duration-200 text-musical-slate ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          >
                            ▲
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalles del pedido */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 p-6 bg-slate-50 space-y-6">
                      <h4 className="text-lg font-bold text-musical-slate mb-4 flex items-center">
                        <span className="mr-2">📎</span>
                        Productos en este pedido
                      </h4>

                      <div className="space-y-4">
                        {pedido.detalles && pedido.detalles.length > 0 ? (
                          pedido.detalles.map((detalle, index) => {
                            const instrumento = detalle.instrumento;

                            if (!instrumento) {
                              return (
                                <div
                                  key={index}
                                  className="bg-white rounded-xl p-4 border border-slate-200"
                                >
                                  <div className="flex items-center space-x-2 text-amber-600">
                                    <span>⚠️</span>
                                    <p className="font-medium">
                                      Información del producto no disponible
                                    </p>
                                  </div>
                                  <div className="mt-3 space-y-1 text-sm text-slate-600">
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
                                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                              >
                                <div className="p-4">
                                  <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                    {/* Imagen del instrumento */}
                                    <div className="flex-shrink-0">
                                      <div className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden">
                                        <img
                                          src={getImageUrl(instrumento.imagen)}
                                          alt={instrumento.denominacion}
                                          className="w-full h-full object-cover"
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
                                    </div>

                                    {/* Info del instrumento */}
                                    <div className="flex-1 space-y-2">
                                      <h5 className="font-bold text-musical-slate text-lg">
                                        {instrumento.denominacion}
                                      </h5>
                                      <div className="space-y-1 text-sm text-slate-600">
                                        <p>
                                          <span className="font-medium">
                                            Marca:
                                          </span>{" "}
                                          {instrumento.marca} |
                                          <span className="font-medium">
                                            {" "}
                                            ID:
                                          </span>{" "}
                                          {instrumento.idInstrumento}
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
                                    <div className="flex-shrink-0 text-right space-y-1">
                                      <p className="text-lg font-bold text-musical-teal">
                                        ${formatPrice(detalle.precioUnitario)}
                                      </p>
                                      <p className="text-sm text-slate-600">
                                        Cantidad: {detalle.cantidad}
                                      </p>
                                      <p className="text-lg font-bold text-musical-slate border-t border-slate-200 pt-2 mt-2">
                                        $
                                        {formatPrice(
                                          detalle.precioUnitario *
                                            detalle.cantidad,
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                            <div className="text-slate-400 text-4xl mb-3">
                              📦
                            </div>
                            <p className="text-slate-600">
                              No hay productos en este pedido
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Resumen del pedido */}
                      <div className="bg-gradient-to-r from-musical-slate/5 to-musical-teal/5 rounded-xl p-6 border border-musical-teal/20">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-medium text-musical-slate">
                            Total del Pedido:
                          </span>
                          <span className="text-2xl font-bold text-musical-teal">
                            ${formatPrice(pedido.total || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Acciones de administración */}
                      <div className="bg-white rounded-xl p-6 border border-slate-200">
                        <h5 className="text-lg font-bold text-musical-slate mb-4 flex items-center">
                          <span className="mr-2">⚙️</span>
                          Administrar Pedido
                        </h5>

                        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                          <label
                            htmlFor={`estado-${pedido.id}`}
                            className="text-sm font-medium text-slate-700"
                          >
                            Cambiar estado del pedido:
                          </label>

                          <div className="flex items-center space-x-3">
                            <select
                              id={`estado-${pedido.id}`}
                              value={
                                pedido.estado || EstadoPedido.PENDIENTE_PAGO
                              }
                              onChange={(e) =>
                                handleCambiarEstado(pedido.id, e.target.value)
                              }
                              disabled={updatingEstado === pedido.id}
                              className={`px-4 py-2 text-sm border border-slate-200 rounded-lg focus:border-musical-teal focus:ring-2 focus:ring-musical-teal/20 bg-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                                updatingEstado === pedido.id
                                  ? "animate-pulse"
                                  : ""
                              }`}
                            >
                              <option value={EstadoPedido.PENDIENTE_PAGO}>
                                Pendiente de Pago
                              </option>
                              <option value={EstadoPedido.PAGADO}>
                                Pagado
                              </option>
                              <option value={EstadoPedido.ENVIADO}>
                                Enviado
                              </option>
                              <option value={EstadoPedido.ENTREGADO}>
                                Entregado
                              </option>
                              <option value={EstadoPedido.CANCELADO}>
                                Cancelado
                              </option>
                            </select>

                            {updatingEstado === pedido.id && (
                              <div className="flex items-center space-x-2 text-musical-teal">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-musical-teal border-t-transparent"></div>
                                <span className="text-sm font-medium">
                                  Actualizando...
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionPedidosPage;
