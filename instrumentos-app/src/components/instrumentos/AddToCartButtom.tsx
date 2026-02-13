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
      <div className={`space-y-4 ${className}`}>
        <button
          className="w-full bg-slate-300 text-slate-500 font-bold py-4 px-6 rounded-xl cursor-not-allowed text-lg"
          disabled
        >
          🚫 Sin stock disponible
        </button>
      </div>
    );
  }

  // ✅ Si no hay precio válido
  if (precioInvalido) {
    return (
      <div className={`space-y-4 ${className}`}>
        <button
          className="w-full bg-slate-300 text-slate-500 font-bold py-4 px-6 rounded-xl cursor-not-allowed text-lg"
          disabled
        >
          💰 Precio no disponible
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selector de cantidad */}
      {showQuantity && (
        <div className="bg-slate-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-musical-slate">
              Cantidad:
            </span>
            <span className="text-xs text-slate-500">
              Stock: {instrumento.stock}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Botón disminuir */}
            <button
              onClick={decrementar}
              className="w-12 h-12 bg-white border-2 border-slate-200 text-musical-slate font-bold text-xl rounded-lg hover:border-musical-teal hover:text-musical-teal focus:ring-4 focus:ring-musical-teal/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-musical-slate"
              disabled={cantidad <= 1 || agregado}
              aria-label="Disminuir cantidad"
              title="Disminuir cantidad"
            >
              −
            </button>

            {/* Input cantidad */}
            <div className="flex-1 relative">
              <input
                type="number"
                className="w-full text-center text-lg font-bold py-3 px-4 border-2 border-slate-200 rounded-lg focus:border-musical-teal focus:ring-4 focus:ring-musical-teal/20 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                value={cantidad}
                onChange={handleCantidadChange}
                min="1"
                max={instrumento.stock}
                disabled={agregado}
                aria-label={`Cantidad: ${cantidad}`}
              />
            </div>

            {/* Botón aumentar */}
            <button
              onClick={incrementar}
              className="w-12 h-12 bg-white border-2 border-slate-200 text-musical-slate font-bold text-xl rounded-lg hover:border-musical-teal hover:text-musical-teal focus:ring-4 focus:ring-musical-teal/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-musical-slate"
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
          </div>

          {/* Advertencia si está por exceder el stock */}
          {cantidad === instrumento.stock && (
            <div className="flex items-center justify-center space-x-2 text-musical-warning text-sm font-medium">
              <span>⚠️</span>
              <span>Stock máximo alcanzado</span>
            </div>
          )}
        </div>
      )}

      {/* Botón agregar al carrito */}
      <button
        className={`w-full font-bold py-4 px-6 rounded-xl text-lg transition-all duration-200 focus:ring-4 focus:ring-musical-teal/20 ${
          agregado
            ? "bg-musical-success text-white shadow-lg"
            : stockInsuficiente
              ? "bg-slate-300 text-slate-500 cursor-not-allowed"
              : "bg-gradient-to-r from-musical-teal to-musical-slate text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        }`}
        onClick={handleAgregar}
        disabled={agregado || stockInsuficiente}
        aria-label={
          agregado
            ? "Producto agregado al carrito"
            : `Agregar ${cantidad} ${cantidad === 1 ? "unidad" : "unidades"} al carrito`
        }
      >
        {agregado ? (
          <span className="flex items-center justify-center space-x-2">
            <span className="text-xl">✓</span>
            <span>¡Agregado al carrito!</span>
          </span>
        ) : (
          <span className="flex items-center justify-center space-x-2">
            <span className="text-xl">🛒</span>
            <span>
              Agregar{showQuantity && cantidad > 1 ? ` (${cantidad})` : ""} al
              carrito
            </span>
          </span>
        )}
      </button>
    </div>
  );
};

export default BotonAgregarCarrito;
