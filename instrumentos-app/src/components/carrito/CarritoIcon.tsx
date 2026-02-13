import React from "react";
import { useCarritoContext } from "../../context/CarritoContext";

const CarritoIcon: React.FC = () => {
  const { totalItems, toggleCarrito } = useCarritoContext();

  return (
    <button
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-musical-teal hover:text-white transition-all duration-200 focus:ring-4 focus:ring-musical-teal/20 group"
      onClick={toggleCarrito}
      aria-label={`Carrito de compras (${totalItems} ${totalItems === 1 ? "ítem" : "ítems"})`}
      title={`Ver carrito (${totalItems})`}
    >
      <span className="text-xl group-hover:scale-110 transition-transform duration-200">
        🛒
      </span>

      {totalItems > 0 && (
        <span
          className="absolute -top-2 -right-2 bg-musical-red text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg animate-pulse"
          aria-label={`${totalItems} productos`}
        >
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </button>
  );
};

export default CarritoIcon;
