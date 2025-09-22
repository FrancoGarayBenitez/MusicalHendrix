import React from "react";
import { CarritoItem as CarritoItemType } from "../../types/pedido";
import { useCarritoContext } from "../../context/CarritoContext";

interface CarritoItemProps {
  item: CarritoItemType;
}

const CarritoItem: React.FC<CarritoItemProps> = ({ item }) => {
  const { actualizarCantidad, eliminarDelCarrito } = useCarritoContext();
  const { instrumento, cantidad } = item;

  //trae el precioActual del backend (calculado desde historial)
  const precio = instrumento.precioActual || 0;

  //subtotal (precio x cantidad)
  const subtotalProducto = precio * cantidad;

  return (
    <div className="carrito-item">
      <div className="item-image">
        <img
          src={`/images/${instrumento.imagen}`}
          alt={instrumento.denominacion}
        />
      </div>

      <div className="item-details">
        <h3 className="item-name">{instrumento.denominacion}</h3>
        <p className="item-brand">{instrumento.marca}</p>
        <p className="item-price">${precio.toLocaleString()}</p>

        {/* Mostrar stock disponible */}
        <p className="item-stock">Stock disponible: {instrumento.stock}</p>
      </div>

      <div className="item-quantity">
        <button
          className="quantity-btn decrease"
          onClick={() =>
            actualizarCantidad(
              instrumento.idInstrumento!.toString(),
              cantidad - 1
            )
          }
          disabled={cantidad <= 1}
        >
          -
        </button>
        <span className="quantity">{cantidad}</span>
        <button
          className="quantity-btn increase"
          onClick={() =>
            actualizarCantidad(
              instrumento.idInstrumento!.toString(),
              cantidad + 1
            )
          }
          disabled={cantidad >= instrumento.stock} //para no excerder el stock
        >
          +
        </button>
      </div>

      <div className="item-subtotal">
        <p className="subtotal-total">${subtotalProducto.toLocaleString()}</p>
      </div>

      <button
        className="remove-btn"
        onClick={() =>
          eliminarDelCarrito(instrumento.idInstrumento!.toString())
        }
        title="Eliminar"
      >
        ×
      </button>
    </div>
  );
};

export default CarritoItem;

//representa cada item en el carrito con controles de cantidad.
