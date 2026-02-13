import { useState } from "react";
import { Instrumento } from "../../types/types";
import { useCategorias } from "../../hooks/useCategorias";
import CategoriaFilter from "./CategoriaFilter";
import Loading from "../common/Loading";
import Error from "../common/Error";

interface InstrumentoGridAdminProps {
  instrumentos: Instrumento[];
  loading: boolean;
  error: string | null;
  selectedCategoriaId: number | null;
  onFilterChange: (categoriaId: number | null) => void;
  onEdit: (instrumento: Instrumento) => void;
  onDelete: (id: string | number) => void;
  onAdd: () => void;
  onPriceUpdate?: (instrumentoId: number, nuevoPrecio: number) => void;
  onStockUpdate?: (instrumentoId: number, cantidad: number) => void;
  isAdmin?: boolean;
}

const InstrumentoGridAdmin = ({
  instrumentos,
  loading,
  error,
  selectedCategoriaId,
  onFilterChange,
  onEdit,
  onDelete,
  onAdd,
  onPriceUpdate,
  onStockUpdate,
  isAdmin = true,
}: InstrumentoGridAdminProps) => {
  const { getCategoriaNameById } = useCategorias();
  const [confirmDelete, setConfirmDelete] = useState<string | number | null>(
    null,
  );
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [editingStock, setEditingStock] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState<string>("");
  const [newStock, setNewStock] = useState<string>("");

  const handleDeleteClick = (id: string | number) => {
    if (!isAdmin) return;
    setConfirmDelete(id);
  };

  const handleConfirmDelete = (id: string | number) => {
    if (!isAdmin) return;
    console.log("🗑️ Eliminando instrumento:", id);
    onDelete(id);
    setConfirmDelete(null);
  };

  const handleCancelDelete = () => {
    setConfirmDelete(null);
  };

  // ✅ Obtener ID del instrumento (seguro)
  const getInstrumentoId = (instrumento: Instrumento): string | number => {
    return instrumento.idInstrumento ?? "";
  };

  // ===== ACTUALIZAR PRECIO =====
  const handlePriceEditClick = (instrumento: Instrumento) => {
    const id = Number(instrumento.idInstrumento);
    console.log("💰 Editando precio del instrumento:", id);
    setEditingPrice(id);
    setNewPrice(instrumento.precioActual?.toString() || "");
  };

  const handlePriceUpdate = async (instrumentoId: number) => {
    const precio = parseFloat(newPrice);

    if (isNaN(precio) || precio <= 0) {
      alert("⚠️ Por favor ingrese un precio válido mayor a 0");
      return;
    }

    if (precio > 999999999.99) {
      alert("⚠️ El precio es demasiado alto");
      return;
    }

    console.log(
      `💰 Actualizando precio del instrumento ${instrumentoId} a $${precio}`,
    );

    if (onPriceUpdate) {
      await onPriceUpdate(instrumentoId, precio);
    }

    setEditingPrice(null);
    setNewPrice("");
  };

  const handlePriceCancel = () => {
    console.log("❌ Cancelando edición de precio");
    setEditingPrice(null);
    setNewPrice("");
  };

  // ===== ACTUALIZAR STOCK =====
  const handleStockEditClick = (instrumento: Instrumento) => {
    const id = Number(instrumento.idInstrumento);
    console.log("📦 Editando stock del instrumento:", id);
    setEditingStock(id);
    setNewStock("");
  };

  const handleStockUpdate = async (instrumentoId: number) => {
    const cantidad = parseInt(newStock);

    if (isNaN(cantidad) || cantidad <= 0) {
      alert("⚠️ Por favor ingrese una cantidad válida mayor a 0");
      return;
    }

    if (cantidad > 999999) {
      alert("⚠️ La cantidad es demasiado alta");
      return;
    }

    console.log(
      `📦 Agregando ${cantidad} unidades al instrumento ${instrumentoId}`,
    );

    if (onStockUpdate) {
      await onStockUpdate(instrumentoId, cantidad);
    }

    setEditingStock(null);
    setNewStock("");
  };

  const handleStockCancel = () => {
    console.log("❌ Cancelando edición de stock");
    setEditingStock(null);
    setNewStock("");
  };

  // ✅ Función para obtener la URL de la imagen según su origen
  const getImageUrl = (imagen: string) => {
    const API_URL = "http://localhost:8080/api";

    if (!imagen) return "/images/placeholder.jpg";

    // Si la imagen fue subida por el admin (nombre con timestamp: 1234567890_archivo.jpg)
    if (/^\d{10,}_/.test(imagen)) {
      return `${API_URL}/uploads/images/${imagen}`;
    }

    // Si es una imagen de la carpeta pública del frontend (seeder)
    return `/images/${imagen}`;
  };

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div className="space-y-6">
      {/* Header con título y botón agregar */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-musical-slate flex items-center">
              <span className="mr-3">🎸</span>
              Administración de Instrumentos
            </h2>
            <p className="text-slate-600 mt-1">
              Gestiona el catálogo de instrumentos musicales
            </p>
          </div>

          {isAdmin && (
            <button
              className="inline-flex items-center bg-gradient-to-r from-musical-teal to-musical-slate text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 space-x-2 text-sm"
              onClick={onAdd}
            >
              <span className="text-lg">➕</span>
              <span>Agregar Instrumento</span>
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <CategoriaFilter
            selectedCategoriaId={selectedCategoriaId}
            onCategoriaChange={onFilterChange}
          />
        </div>
      </div>

      {instrumentos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-bold text-musical-slate mb-3">
              {selectedCategoriaId
                ? "No hay instrumentos en esta categoría"
                : "No hay instrumentos disponibles"}
            </h3>
            <p className="text-slate-600 text-sm">
              {selectedCategoriaId
                ? "Intenta cambiar el filtro de categoría"
                : "Comienza agregando tu primer instrumento"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Imagen
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Instrumento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Marca
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {instrumentos.map((instrumento) => {
                  const instrumentoId = getInstrumentoId(instrumento);
                  const numericId = Number(instrumento.idInstrumento);

                  return (
                    <tr
                      key={instrumentoId}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden">
                          <img
                            src={getImageUrl(instrumento.imagen)}
                            alt={instrumento.denominacion}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error(
                                "❌ Error al cargar imagen:",
                                instrumento.imagen,
                              );
                              e.currentTarget.src = "/images/placeholder.jpg";
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-musical-slate">
                        {instrumento.idInstrumento}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p
                            className="text-sm font-medium text-musical-slate line-clamp-2"
                            title={instrumento.denominacion}
                          >
                            {instrumento.denominacion}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {instrumento.marca}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {instrumento.categoriaInstrumento?.denominacion ??
                            "Sin categoría"}
                        </span>
                      </td>

                      {/* CELDA DE PRECIO - Edición inline */}
                      <td className="px-6 py-4">
                        {editingPrice === numericId ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={newPrice}
                              onChange={(e) => setNewPrice(e.target.value)}
                              placeholder="Nuevo precio"
                              className="w-24 px-2 py-1 text-sm border-2 border-slate-200 rounded-lg focus:border-musical-teal focus:ring-4 focus:ring-musical-teal/10 transition-all"
                              min="0.01"
                              step="0.01"
                            />
                            <button
                              onClick={() => handlePriceUpdate(numericId)}
                              className="w-6 h-6 bg-green-500 text-white text-xs rounded flex items-center justify-center hover:bg-green-600 transition-colors"
                              title="Guardar precio"
                            >
                              ✓
                            </button>
                            <button
                              onClick={handlePriceCancel}
                              className="w-6 h-6 bg-slate-400 text-white text-xs rounded flex items-center justify-center hover:bg-slate-500 transition-colors"
                              title="Cancelar"
                            >
                              ✗
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-musical-teal">
                              {typeof instrumento.precioActual === "number" &&
                              !isNaN(instrumento.precioActual)
                                ? `$${instrumento.precioActual.toLocaleString("es-AR")}`
                                : "No definido"}
                            </span>
                            {onPriceUpdate && (
                              <button
                                onClick={() =>
                                  handlePriceEditClick(instrumento)
                                }
                                className="ml-2 w-6 h-6 bg-slate-100 text-musical-slate text-xs rounded hover:bg-musical-teal hover:text-white transition-all duration-200 flex items-center justify-center"
                                title="Actualizar precio"
                              >
                                💰
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* CELDA DE STOCK - Edición inline */}
                      <td className="px-6 py-4">
                        {editingStock === numericId ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={newStock}
                              onChange={(e) => setNewStock(e.target.value)}
                              placeholder="Cantidad"
                              className="w-20 px-2 py-1 text-sm border-2 border-slate-200 rounded-lg focus:border-musical-teal focus:ring-4 focus:ring-musical-teal/10 transition-all"
                              min="1"
                            />
                            <button
                              onClick={() => handleStockUpdate(numericId)}
                              className="w-6 h-6 bg-green-500 text-white text-xs rounded flex items-center justify-center hover:bg-green-600 transition-colors"
                              title="Agregar stock"
                            >
                              ✓
                            </button>
                            <button
                              onClick={handleStockCancel}
                              className="w-6 h-6 bg-slate-400 text-white text-xs rounded flex items-center justify-center hover:bg-slate-500 transition-colors"
                              title="Cancelar"
                            >
                              ✗
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-sm font-medium ${
                                instrumento.stock === 0
                                  ? "text-red-500"
                                  : instrumento.stock < 5
                                    ? "text-musical-warning"
                                    : "text-musical-success"
                              }`}
                            >
                              {instrumento.stock}
                              <span className="text-xs text-slate-500 ml-1">
                                {instrumento.stock === 1
                                  ? "unidad"
                                  : "unidades"}
                              </span>
                            </span>
                            {onStockUpdate && (
                              <button
                                onClick={() =>
                                  handleStockEditClick(instrumento)
                                }
                                className="ml-2 w-6 h-6 bg-slate-100 text-musical-slate text-xs rounded hover:bg-musical-teal hover:text-white transition-all duration-200 flex items-center justify-center"
                                title="Reponer stock"
                              >
                                📦
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* CELDA DE ACCIONES */}
                      <td className="px-6 py-4">
                        {confirmDelete === instrumentoId ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-musical-slate mr-2">
                              ¿ Eliminar?
                            </span>
                            <button
                              onClick={() => handleConfirmDelete(instrumentoId)}
                              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors font-medium"
                            >
                              Sí
                            </button>
                            <button
                              onClick={handleCancelDelete}
                              className="px-3 py-1 bg-slate-400 text-white text-xs rounded hover:bg-slate-500 transition-colors font-medium"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onEdit(instrumento)}
                              className="inline-flex items-center px-3 py-1.5 bg-slate-100 text-musical-slate text-xs font-medium rounded-lg hover:bg-musical-teal hover:text-white transition-all duration-200 space-x-1"
                              title="Editar instrumento"
                            >
                              <span>✏️</span>
                              <span>Editar</span>
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteClick(instrumentoId)}
                                className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-all duration-200 space-x-1"
                                title="Eliminar instrumento"
                              >
                                <span>🗑️</span>
                                <span>Eliminar</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstrumentoGridAdmin;
