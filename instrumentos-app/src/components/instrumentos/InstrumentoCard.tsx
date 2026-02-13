import { Link } from "react-router-dom";
import { Instrumento } from "../../types/types";
import BotonAgregarCarrito from "./AddToCartButtom";

interface InstrumentoCardProps {
  instrumento: Instrumento;
}

/**
 * Tarjeta de instrumento para visualización en catálogo
 * Muestra información básica y opciones de compra
 */
const InstrumentoCard: React.FC<InstrumentoCardProps> = ({ instrumento }) => {
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

  // ✅ Validar que el instrumento tenga ID
  const instrumentoId = instrumento.idInstrumento;
  if (!instrumentoId) {
    console.error("❌ Instrumento sin ID:", instrumento);
    return null;
  }

  // ✅ Calcular estado del stock
  const sinStock = instrumento.stock === 0;
  const bajoStock = instrumento.stock > 0 && instrumento.stock < 5;

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${sinStock ? "opacity-75" : ""}`}
    >
      {/* Imagen del instrumento */}
      <div className="relative aspect-square overflow-hidden">
        <Link to={`/instrumento/${instrumentoId}`}>
          <img
            src={getImageUrl(instrumento.imagen)}
            alt={instrumento.denominacion}
            onError={(e) => {
              console.error("❌ Error al cargar imagen:", instrumento.imagen);
              e.currentTarget.src = "/images/placeholder.jpg";
            }}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </Link>

        {/* Badges de stock */}
        {sinStock && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Sin Stock
          </span>
        )}
        {bajoStock && (
          <span className="absolute top-3 right-3 bg-musical-warning text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            Últimas {instrumento.stock}
          </span>
        )}
      </div>

      {/* Información del instrumento */}
      <div className="p-6 space-y-4">
        {/* Título */}
        <div>
          <Link
            to={`/instrumento/${instrumentoId}`}
            className="block group"
            title={instrumento.denominacion}
          >
            <h2 className="text-lg font-bold text-musical-slate group-hover:text-musical-teal transition-colors duration-200 line-clamp-2 leading-tight">
              {instrumento.denominacion}
            </h2>
          </Link>
        </div>

        {/* Marca y Categoría */}
        <div className="space-y-2 text-sm">
          <p className="flex items-center text-slate-600">
            <span className="w-16 font-medium text-musical-slate">Marca:</span>
            <span className="font-semibold">{instrumento.marca}</span>
          </p>
          <p className="flex items-center text-slate-600">
            <span className="w-16 font-medium text-musical-slate">Tipo:</span>
            <span className="font-semibold">
              {instrumento.categoriaInstrumento?.denominacion ||
                "Sin categoría"}
            </span>
          </p>
        </div>

        {/* Precio */}
        <div className="pt-2">
          {instrumento.precioActual && instrumento.precioActual > 0 ? (
            <p className="text-2xl font-bold text-musical-teal">
              $
              {instrumento.precioActual.toLocaleString("es-AR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </p>
          ) : (
            <p className="text-xl font-bold text-slate-400">
              Precio no disponible
            </p>
          )}
        </div>

        {/* Stock info */}
        <div className="pt-2">
          {sinStock ? (
            <div className="flex items-center text-red-500 text-sm font-medium">
              <span className="mr-2">❌</span>
              Sin stock
            </div>
          ) : bajoStock ? (
            <div className="flex items-center text-musical-warning text-sm font-medium">
              <span className="mr-2">⚠️</span>
              Stock bajo: {instrumento.stock}{" "}
              {instrumento.stock === 1 ? "unidad" : "unidades"}
            </div>
          ) : (
            <div className="flex items-center text-musical-success text-sm font-medium">
              <span className="mr-2">✅</span>
              Stock disponible: {instrumento.stock}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="pt-4 space-y-3">
          {/* Ver detalle */}
          <Link
            to={`/instrumento/${instrumentoId}`}
            className="block w-full bg-slate-100 text-musical-slate font-semibold text-center py-3 px-4 rounded-lg border-2 border-slate-200 hover:border-musical-slate hover:bg-slate-50 transition-all duration-200"
            title={`Ver detalles de ${instrumento.denominacion}`}
          >
            👁️ Ver Detalle
          </Link>

          {/* Botón agregar al carrito o mensaje sin stock */}
          {!sinStock ? (
            <BotonAgregarCarrito
              instrumento={instrumento}
              showQuantity={false}
            />
          ) : (
            <button
              className="w-full bg-slate-200 text-slate-500 font-semibold py-3 px-4 rounded-lg cursor-not-allowed"
              disabled
            >
              🚫 Sin stock disponible
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstrumentoCard;
