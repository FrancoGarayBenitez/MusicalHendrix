import { useState } from "react";
import { Instrumento } from "../../types/types";
import { useCategorias } from "../../hooks/useCategorias";
import CategoriaFilter from "./CategoriaFilter";
import Loading from "../common/Loading";
import Error from "../common/Error";
import "./InstrumentoTable.css";

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
    <div className="instrumento-grid-admin" style={{ marginTop: "10px" }}>
      <div className="admin-header">
        <h2>Administración de Instrumentos</h2>
        <div className="admin-actions" style={{ marginTop: "10px" }}>
          {isAdmin && (
            <button
              className="btn btn-primary add-btn"
              onClick={onAdd}
              style={{ marginBottom: "20px" }}
            >
              ➕ Agregar Instrumento
            </button>
          )}
          <CategoriaFilter
            selectedCategoriaId={selectedCategoriaId}
            onCategoriaChange={onFilterChange}
          />
        </div>
      </div>

      {instrumentos.length === 0 ? (
        <div className="no-data">
          {selectedCategoriaId
            ? "📂 No hay instrumentos en esta categoría"
            : "📂 No hay instrumentos disponibles"}
        </div>
      ) : (
        <div className="table-responsive" style={{ marginTop: "20px" }}>
          <table className="instrumento-table">
            <thead>
              <tr>
                <th>Imagen</th>
                <th>ID</th>
                <th>Instrumento</th>
                <th>Marca</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {instrumentos.map((instrumento) => {
                const instrumentoId = getInstrumentoId(instrumento);
                const numericId = Number(instrumento.idInstrumento);

                return (
                  <tr key={instrumentoId}>
                    <td className="img-cell" data-label="Imagen">
                      <img
                        src={getImageUrl(instrumento.imagen)}
                        alt={instrumento.denominacion}
                        className="table-img"
                        onError={(e) => {
                          console.error(
                            "❌ Error al cargar imagen:",
                            instrumento.imagen,
                          );
                          e.currentTarget.src = "/images/placeholder.jpg";
                        }}
                      />
                    </td>
                    <td data-label="ID">{instrumento.idInstrumento}</td>
                    <td data-label="Instrumento">{instrumento.denominacion}</td>
                    <td data-label="Marca">{instrumento.marca}</td>
                    <td data-label="Categoría">
                      {instrumento.categoriaInstrumento?.denominacion ??
                        "Sin categoría"}
                    </td>

                    {/* CELDA DE PRECIO - Edición inline */}
                    <td className="price-cell" data-label="Precio">
                      {editingPrice === numericId ? (
                        <div className="price-edit">
                          <input
                            type="number"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            placeholder="Nuevo precio"
                            style={{ width: "100px", marginRight: "5px" }}
                            min="0.01"
                            step="0.01"
                          />
                          <button
                            onClick={() => handlePriceUpdate(numericId)}
                            className="btn btn-sm btn-success"
                            style={{ marginRight: "2px" }}
                            title="Guardar precio"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handlePriceCancel}
                            className="btn btn-sm btn-secondary"
                            title="Cancelar"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <div className="price-display">
                          <span>
                            {typeof instrumento.precioActual === "number" &&
                            !isNaN(instrumento.precioActual)
                              ? `$${instrumento.precioActual.toLocaleString("es-AR")}`
                              : "No definido"}
                          </span>
                          {onPriceUpdate && (
                            <button
                              onClick={() => handlePriceEditClick(instrumento)}
                              className="btn btn-sm btn-outline"
                              style={{ marginLeft: "5px" }}
                              title="Actualizar precio"
                            >
                              💰
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* CELDA DE STOCK - Edición inline */}
                    <td
                      className={`centered ${instrumento.stock === 0 ? "no-stock" : instrumento.stock < 5 ? "bajo-stock" : ""}`}
                      data-label="Stock"
                    >
                      {editingStock === numericId ? (
                        <div className="stock-edit">
                          <input
                            type="number"
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                            placeholder="Cantidad"
                            style={{ width: "80px", marginRight: "5px" }}
                            min="1"
                          />
                          <button
                            onClick={() => handleStockUpdate(numericId)}
                            className="btn btn-sm btn-success"
                            style={{ marginRight: "2px" }}
                            title="Agregar stock"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleStockCancel}
                            className="btn btn-sm btn-secondary"
                            title="Cancelar"
                          >
                            ✗
                          </button>
                        </div>
                      ) : (
                        <div className="stock-display">
                          <span
                            className={
                              instrumento.stock === 0
                                ? "stock-zero"
                                : instrumento.stock < 5
                                  ? "stock-bajo"
                                  : ""
                            }
                          >
                            {instrumento.stock}
                          </span>
                          {onStockUpdate && (
                            <button
                              onClick={() => handleStockEditClick(instrumento)}
                              className="btn btn-sm btn-outline"
                              style={{ marginLeft: "5px" }}
                              title="Reponer stock"
                            >
                              📦
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* CELDA DE ACCIONES */}
                    <td className="actions-cell" data-label="Acciones">
                      {confirmDelete === instrumentoId ? (
                        <div className="confirm-delete">
                          <span>¿Eliminar?</span>
                          <button
                            onClick={() => handleConfirmDelete(instrumentoId)}
                            className="btn btn-danger btn-sm"
                          >
                            Sí
                          </button>
                          <button
                            onClick={handleCancelDelete}
                            className="btn btn-secondary btn-sm"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => onEdit(instrumento)}
                            className="btn btn-outline btn-sm edit-btn"
                            title="Editar instrumento"
                          >
                            ✏️ Editar
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteClick(instrumentoId)}
                              className="btn btn-outline btn-sm delete-btn"
                              title="Eliminar instrumento"
                            >
                              🗑️ Eliminar
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InstrumentoGridAdmin;
