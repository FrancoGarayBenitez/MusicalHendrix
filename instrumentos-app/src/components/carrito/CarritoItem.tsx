import React from "react";
import { CarritoItem as CarritoItemType } from "../../types/pedido";
import { useCarritoContext } from "../../context/CarritoContext";

interface CarritoItemProps {
  item: CarritoItemType;
}

const CarritoItem: React.FC<CarritoItemProps> = ({ item }) => {
  const { actualizarCantidad, eliminarDelCarrito } = useCarritoContext();
  const { instrumento, cantidad } = item;

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
      className={`carrito-item ${excedeStock || sinStock ? "excede-stock" : ""}`}
      data-instrumento-id={instrumento.idInstrumento}
    >
      {/* Imagen */}
      <div className="item-image">
        <img
          src={`/images/${instrumento.imagen}`}
          alt={instrumento.denominacion}
          onError={(e) => {
            e.currentTarget.src = "/images/placeholder.jpg";
          }}
          loading="lazy"
        />
      </div>

      {/* Detalles */}
      <div className="item-details">
        <h3 className="item-name" title={instrumento.denominacion}>
          {instrumento.denominacion}
        </h3>
        <p className="item-brand">{instrumento.marca}</p>
        <p className="item-price">
          $
          {precio.toLocaleString("es-AR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </p>

        {/* Stock disponible */}
        <p
          className={`item-stock ${
            sinStock ? "sin-stock" : instrumento.stock < 5 ? "bajo-stock" : ""
          }`}
        >
          {sinStock
            ? "⚠️ Sin stock"
            : `Stock: ${instrumento.stock} unidad${instrumento.stock !== 1 ? "es" : ""}`}
        </p>

        {/* Advertencia si excede stock */}
        {excedeStock && !sinStock && (
          <p className="advertencia-stock">
            ⚠️ Cantidad supera stock disponible ({instrumento.stock})
          </p>
        )}
      </div>

      {/* Controles de cantidad */}
      <div className="item-quantity">
        <button
          className="quantity-btn decrease"
          onClick={handleDecrease}
          disabled={cantidad <= 1}
          aria-label="Disminuir cantidad"
          title="Disminuir cantidad"
        >
          −
        </button>
        <span className="quantity" aria-label={`Cantidad: ${cantidad}`}>
          {cantidad}
        </span>
        <button
          className="quantity-btn increase"
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
      <div className="item-subtotal">
        <p className="subtotal-total">
          $
          {subtotalProducto.toLocaleString("es-AR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Botón eliminar */}
      <button
        className="remove-btn"
        onClick={handleRemove}
        title={`Eliminar ${instrumento.denominacion} del carrito`}
        aria-label={`Eliminar ${instrumento.denominacion}`}
      >
        ×
      </button>
    </div>
  );
};

export default CarritoItem;
