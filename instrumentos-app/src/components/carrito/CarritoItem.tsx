import React from "react";
import { CarritoItem as CarritoItemType } from "../../types/pedido";
import { useCarritoContext } from "../../context/CarritoContext";

interface CarritoItemProps {
  item: CarritoItemType;
}

const CarritoItem: React.FC<CarritoItemProps> = ({ item }) => {
  const { actualizarCantidad, eliminarDelCarrito } = useCarritoContext();
  const { instrumento, cantidad } = item;

  // ✅ Función para obtener la URL correcta de la imagen
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

  // ✅ Asegurar que precio existe
  const precio = instrumento.precioActual || 0;
  const subtotalProducto = precio * cantidad;

  // Verificar si cantidad excede stock
  const excedeStock = cantidad > instrumento.stock;
  const sinStock = instrumento.stock === 0;

  const handleDecrease = () => {
    if (cantidad > 1) {
      actualizarCantidad(instrumento.idInstrumento!.toString(), cantidad - 1);
    }
  };

  const handleIncrease = () => {
    if (cantidad < instrumento.stock) {
      actualizarCantidad(instrumento.idInstrumento!.toString(), cantidad + 1);
    }
  };

  const handleRemove = () => {
    if (window.confirm(`¿Eliminar ${instrumento.denominacion} del carrito?`)) {
      eliminarDelCarrito(instrumento.idInstrumento!.toString());
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border-2 p-4 transition-all duration-200 ${
        excedeStock || sinStock
          ? "border-red-200 bg-red-50"
          : "border-slate-200 hover:border-musical-teal/30"
      }`}
      data-instrumento-id={instrumento.idInstrumento}
    >
      <div className="flex items-start space-x-4">
        {/* Imagen */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden">
            <img
              src={getImageUrl(instrumento.imagen)}
              alt={instrumento.denominacion}
              onError={(e) => {
                e.currentTarget.src = "/images/placeholder.jpg";
              }}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Detalles principales */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3
                className="text-sm font-semibold text-musical-slate line-clamp-2 leading-tight"
                title={instrumento.denominacion}
              >
                {instrumento.denominacion}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {instrumento.marca}
              </p>
            </div>

            {/* Botón eliminar */}
            <button
              className="flex-shrink-0 w-6 h-6 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center transition-all duration-200 text-lg font-bold"
              onClick={handleRemove}
              title={`Eliminar ${instrumento.denominacion} del carrito`}
              aria-label={`Eliminar ${instrumento.denominacion}`}
            >
              ×
            </button>
          </div>

          {/* Precio unitario */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-musical-teal">
              $
              {precio.toLocaleString("es-AR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </p>
          </div>

          {/* Stock info */}
          <div className="text-xs">
            {sinStock ? (
              <span className="text-red-500 font-medium">⚠️ Sin stock</span>
            ) : (
              <span
                className={`${instrumento.stock < 5 ? "text-musical-warning" : "text-slate-500"} font-medium`}
              >
                Stock: {instrumento.stock}
              </span>
            )}
          </div>

          {/* Advertencia si excede stock */}
          {excedeStock && !sinStock && (
            <div className="bg-red-100 border border-red-200 rounded-md p-2 text-xs text-red-600">
              ⚠️ Cantidad supera stock disponible ({instrumento.stock})
            </div>
          )}

          {/* Controles de cantidad y subtotal */}
          <div className="flex items-center justify-between pt-2">
            {/* Controles de cantidad */}
            <div className="flex items-center space-x-2">
              <button
                className="w-6 h-6 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded text-musical-slate font-bold text-sm flex items-center justify-center transition-colors duration-200"
                onClick={handleDecrease}
                disabled={cantidad <= 1}
                aria-label="Disminuir cantidad"
                title="Disminuir cantidad"
              >
                −
              </button>

              <span
                className="text-sm font-bold text-musical-slate min-w-[1.5rem] text-center"
                aria-label={`Cantidad: ${cantidad}`}
              >
                {cantidad}
              </span>

              <button
                className="w-6 h-6 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded text-musical-slate font-bold text-sm flex items-center justify-center transition-colors duration-200"
                onClick={handleIncrease}
                disabled={cantidad >= instrumento.stock || sinStock}
                aria-label="Aumentar cantidad"
                title={
                  sinStock
                    ? "Sin stock disponible"
                    : cantidad >= instrumento.stock
                      ? "Stock máximo alcanzado"
                      : "Aumentar cantidad"
                }
              >
                +
              </button>
            </div>

            {/* Subtotal */}
            <div className="text-right">
              <p className="text-sm font-bold text-musical-slate">
                $
                {subtotalProducto.toLocaleString("es-AR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarritoItem;
