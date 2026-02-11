import React from "react";
import { useCarritoContext } from "../../context/CarritoContext";

const CarritoIcon: React.FC = () => {
  const { totalItems, toggleCarrito } = useCarritoContext();

  return (
    <button
      className="carrito-icon"
      onClick={toggleCarrito}
      aria-label={`Carrito de compras (${totalItems} ${totalItems === 1 ? "ítem" : "ítems"})`}
      title={`Ver carrito (${totalItems})`}
    >
      <span className="icon">🛒</span>
      {totalItems > 0 && (
        <span className="badge" aria-label={`${totalItems} productos`}>
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
};

export default CarritoIcon;
