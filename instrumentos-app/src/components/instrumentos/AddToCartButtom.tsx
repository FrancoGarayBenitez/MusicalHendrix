import React, { useState, useEffect } from "react";
import { Instrumento } from "../../types/types";
import { useCarritoContext } from "../../context/CarritoContext";

interface BotonAgregarCarritoProps {
  instrumento: Instrumento;
  showQuantity?: boolean;
  className?: string;
}

/**
 * Botón para agregar instrumentos al carrito
 * Con selector de cantidad opcional
 */
const BotonAgregarCarrito: React.FC<BotonAgregarCarritoProps> = ({
  instrumento,
  showQuantity = false,
  className = "",
}) => {
  const { agregarAlCarrito } = useCarritoContext();
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);

  // ✅ Validaciones
  const sinStock = instrumento.stock === 0;
  const stockInsuficiente = cantidad > instrumento.stock;
  const precioInvalido =
    !instrumento.precioActual || instrumento.precioActual <= 0;

  // ✅ Resetear cantidad si cambia el stock del instrumento
  useEffect(() => {
    if (cantidad > instrumento.stock && instrumento.stock > 0) {
      setCantidad(instrumento.stock);
    }
  }, [instrumento.stock, cantidad]);

  const handleAgregar = () => {
    // ✅ Validaciones antes de agregar
    if (sinStock) {
      alert("❌ Este producto no tiene stock disponible");
      return;
    }

    if (precioInvalido) {
      alert("❌ Este producto no tiene un precio válido");
      return;
    }

    if (stockInsuficiente) {
      alert(`⚠️ Solo hay ${instrumento.stock} unidades disponibles`);
      return;
    }

    if (cantidad <= 0) {
      alert("⚠️ La cantidad debe ser mayor a 0");
      return;
    }

    console.log(
      `🛒 Agregando ${cantidad}x ${instrumento.denominacion} al carrito`,
    );

    // Agregar al carrito
    agregarAlCarrito(instrumento, cantidad);

    // Feedback visual
    setAgregado(true);

    setTimeout(() => {
      setAgregado(false);
      // Resetear cantidad solo si no hay showQuantity
      if (!showQuantity) {
        setCantidad(1);
      }
    }, 1500);
  };

  const incrementar = () => {
    if (cantidad < instrumento.stock) {
      setCantidad((prev) => prev + 1);
    } else {
      alert(`⚠️ Stock máximo alcanzado: ${instrumento.stock} unidades`);
    }
  };

  const decrementar = () => {
    if (cantidad > 1) {
      setCantidad((prev) => prev - 1);
    }
  };

  const handleCantidadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);

    if (isNaN(value) || value < 1) {
      setCantidad(1);
      return;
    }

    if (value > instrumento.stock) {
      setCantidad(instrumento.stock);
      alert(`⚠️ Stock máximo: ${instrumento.stock} unidades`);
      return;
    }

    setCantidad(value);
  };

  // ✅ Si no hay stock, no mostrar el componente
  if (sinStock) {
    return (
      <div className={`agregar-carrito-container ${className}`}>
        <button className="agregar-carrito-btn disabled sin-stock-btn" disabled>
          Sin stock disponible
        </button>
      </div>
    );
  }

  // ✅ Si no hay precio válido
  if (precioInvalido) {
    return (
      <div className={`agregar-carrito-container ${className}`}>
        <button className="agregar-carrito-btn disabled" disabled>
          Precio no disponible
        </button>
      </div>
    );
  }

  return (
    <div className={`agregar-carrito-container ${className}`}>
      {showQuantity && (
        <div className="quantity-selector">
          <button
            onClick={decrementar}
            className="quantity-btn decrease"
            disabled={cantidad <= 1 || agregado}
            aria-label="Disminuir cantidad"
            title="Disminuir cantidad"
          >
            −
          </button>

          <input
            type="number"
            className="quantity-input"
            value={cantidad}
            onChange={handleCantidadChange}
            min="1"
            max={instrumento.stock}
            disabled={agregado}
            aria-label={`Cantidad: ${cantidad}`}
          />

          <button
            onClick={incrementar}
            className="quantity-btn increase"
            disabled={cantidad >= instrumento.stock || agregado}
            aria-label="Aumentar cantidad"
            title={
              cantidad >= instrumento.stock
                ? `Stock máximo: ${instrumento.stock}`
                : "Aumentar cantidad"
            }
          >
            +
          </button>

          {/* Mostrar stock disponible */}
          <span className="stock-disponible-text">
            (Stock: {instrumento.stock})
          </span>
        </div>
      )}

      <button
        className={`agregar-carrito-btn ${agregado ? "agregado" : ""} ${
          stockInsuficiente ? "disabled" : ""
        }`}
        onClick={handleAgregar}
        disabled={agregado || stockInsuficiente}
        aria-label={
          agregado
            ? "Producto agregado al carrito"
            : `Agregar ${cantidad} ${cantidad === 1 ? "unidad" : "unidades"} al carrito`
        }
      >
        {agregado ? "✓ Agregado" : "Agregar al carrito"}
      </button>

      {/* Advertencia si está por exceder el stock */}
      {showQuantity && cantidad === instrumento.stock && (
        <small className="stock-warning">⚠️ Stock máximo alcanzado</small>
      )}
    </div>
  );
};

export default BotonAgregarCarrito;
