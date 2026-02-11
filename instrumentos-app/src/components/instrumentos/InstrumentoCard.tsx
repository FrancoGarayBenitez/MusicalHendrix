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
  const stockDisponible = instrumento.stock >= 5;

  return (
    <div
      className={`instrumento-card ${sinStock ? "sin-stock-card" : ""}`}
      data-instrumento-id={instrumentoId}
    >
      {/* Imagen del instrumento */}
      <div className="instrumento-img">
        <Link to={`/instrumento/${instrumentoId}`}>
          <img
            src={getImageUrl(instrumento.imagen)}
            alt={instrumento.denominacion}
            onError={(e) => {
              console.error("❌ Error al cargar imagen:", instrumento.imagen);
              e.currentTarget.src = "/images/placeholder.jpg";
            }}
            loading="lazy"
          />
        </Link>

        {/* Badge de stock */}
        {sinStock && (
          <span className="stock-badge sin-stock-badge">Sin Stock</span>
        )}
        {bajoStock && (
          <span className="stock-badge bajo-stock-badge">
            Últimas {instrumento.stock} unidades
          </span>
        )}
      </div>

      {/* Información del instrumento */}
      <div className="instrumento-info">
        <Link
          to={`/instrumento/${instrumentoId}`}
          className="title-link"
          title={instrumento.denominacion}
        >
          <h2 className="instrumento-title">{instrumento.denominacion}</h2>
        </Link>

        {/* Marca */}
        <p className="instrumento-marca">
          <span className="label">Marca:</span> {instrumento.marca}
        </p>

        {/* Categoría */}
        <p className="instrumento-categoria">
          <span className="label">Categoría:</span>{" "}
          {instrumento.categoriaInstrumento?.denominacion || "Sin categoría"}
        </p>

        {/* Precio - ✅ Mostrar solo si está disponible y es mayor a 0 */}
        {instrumento.precioActual && instrumento.precioActual > 0 ? (
          <p className="instrumento-precio">
            $
            {instrumento.precioActual.toLocaleString("es-AR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </p>
        ) : (
          <p className="instrumento-precio no-precio">Precio no disponible</p>
        )}

        {/* Stock disponible */}
        <p className="stock-info">
          {sinStock ? (
            <span className="sin-stock">❌ Sin stock</span>
          ) : bajoStock ? (
            <span className="bajo-stock">
              ⚠️ Stock bajo: {instrumento.stock}{" "}
              {instrumento.stock === 1 ? "unidad" : "unidades"}
            </span>
          ) : (
            <span className="stock-disponible">
              ✅ Stock disponible: {instrumento.stock}
            </span>
          )}
        </p>

        {/* Acciones */}
        <div className="card-actions">
          <Link
            to={`/instrumento/${instrumentoId}`}
            className="detalle-btn"
            title={`Ver detalles de ${instrumento.denominacion}`}
          >
            Ver Detalle
          </Link>

          {/* Botón para agregar al carrito - solo si hay stock */}
          {!sinStock && (
            <BotonAgregarCarrito
              instrumento={instrumento}
              showQuantity={false}
            />
          )}

          {/* Mensaje si no hay stock */}
          {sinStock && (
            <button className="agregar-carrito-btn disabled" disabled>
              Sin stock disponible
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstrumentoCard;
