import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Instrumento } from "../types/types";
import { fetchInstrumentoById } from "../service/api";
import Loading from "../components/common/Loading";
import Error from "../components/common/Error";
import BotonAgregarCarrito from "../components/instrumentos/AddToCartButtom";

const DetalleInstrumentoPage = () => {
  const { id } = useParams<{ id: string }>();
  const [instrumento, setInstrumento] = useState<Instrumento | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const getInstrumento = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await fetchInstrumentoById(id);
        setInstrumento(data);
        setError(null);
      } catch (err) {
        setError(
          "Error al cargar el instrumento. Por favor, intenta nuevamente.",
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    getInstrumento();
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  if (!instrumento) return <Error message="Instrumento no encontrado" />;

  // ✅ Calcular estado del stock
  const sinStock = instrumento.stock === 0;
  const bajoStock = instrumento.stock > 0 && instrumento.stock < 5;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-slate-600 mb-8">
          <Link
            to="/"
            className="hover:text-musical-teal transition-colors duration-200"
          >
            🏠 Inicio
          </Link>
          <span>/</span>
          <Link
            to="/productos"
            className="hover:text-musical-teal transition-colors duration-200"
          >
            📦 Productos
          </Link>
          <span>/</span>
          <span className="text-musical-slate font-medium truncate max-w-xs">
            {instrumento.denominacion}
          </span>
        </nav>

        {/* Contenido principal */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Imagen del instrumento */}
            <div className="relative bg-slate-100 flex items-center justify-center p-8">
              <div className="aspect-square w-full max-w-md">
                <img
                  src={getImageUrl(instrumento.imagen)}
                  alt={instrumento.denominacion}
                  onError={(e) => {
                    console.error(
                      "❌ Error al cargar imagen:",
                      instrumento.imagen,
                    );
                    e.currentTarget.src = "/images/placeholder.jpg";
                  }}
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              </div>

              {/* Badge de stock sobre la imagen */}
              {sinStock && (
                <div className="absolute top-12 right-12 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  Sin Stock
                </div>
              )}
              {bajoStock && (
                <div className="absolute top-12 right-12 bg-musical-warning text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⚠️ ¡Últimas {instrumento.stock}!
                </div>
              )}
            </div>

            {/* Información del instrumento */}
            <div className="p-8 lg:p-12 space-y-8">
              {/* Título y marca */}
              <div className="space-y-4">
                <h1 className="text-3xl lg:text-4xl font-bold text-musical-slate leading-tight">
                  {instrumento.denominacion}
                </h1>

                <div className="flex items-center space-x-6 text-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-musical-teal font-semibold">
                      🏷️ Marca:
                    </span>
                    <span className="font-bold text-musical-slate">
                      {instrumento.marca}
                    </span>
                  </div>
                </div>
              </div>

              {/* Meta información */}
              <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-musical-slate mb-4">
                  📋 Información del producto
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 bg-musical-teal rounded-full"></span>
                    <span className="text-slate-600">Categoría:</span>
                    <span className="font-semibold text-musical-slate">
                      {instrumento.categoriaInstrumento?.denominacion ||
                        "Sin categoría"}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 bg-musical-success rounded-full"></span>
                    <span className="text-slate-600">Stock:</span>
                    <span
                      className={`font-semibold ${sinStock ? "text-red-500" : bajoStock ? "text-musical-warning" : "text-musical-success"}`}
                    >
                      {sinStock
                        ? "Sin stock"
                        : `${instrumento.stock} disponibles`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Precio */}
              {instrumento.precioActual && instrumento.precioActual > 0 ? (
                <div className="bg-gradient-to-r from-musical-teal to-musical-slate p-6 rounded-xl text-center">
                  <p className="text-sm text-white/80 mb-2">Precio</p>
                  <p className="text-4xl lg:text-5xl font-bold text-white">
                    $
                    {instrumento.precioActual.toLocaleString("es-AR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              ) : (
                <div className="bg-slate-200 p-6 rounded-xl text-center">
                  <p className="text-xl font-bold text-slate-500">
                    Precio no disponible
                  </p>
                </div>
              )}

              {/* Estado del stock */}
              <div className="flex items-center justify-center p-4 rounded-xl border-2 border-dashed">
                {sinStock ? (
                  <div className="flex items-center space-x-3 text-red-500">
                    <span className="text-2xl">❌</span>
                    <span className="font-semibold text-lg">
                      Producto sin stock
                    </span>
                  </div>
                ) : bajoStock ? (
                  <div className="flex items-center space-x-3 text-musical-warning">
                    <span className="text-2xl">⚠️</span>
                    <span className="font-semibold text-lg">
                      ¡Quedan solo {instrumento.stock}{" "}
                      {instrumento.stock === 1 ? "unidad" : "unidades"}!
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3 text-musical-success">
                    <span className="text-2xl">✅</span>
                    <span className="font-semibold text-lg">
                      Stock disponible ({instrumento.stock} unidades)
                    </span>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="space-y-4">
                {!sinStock ? (
                  <BotonAgregarCarrito
                    instrumento={instrumento}
                    showQuantity={true}
                  />
                ) : (
                  <button
                    className="w-full bg-slate-300 text-slate-500 font-bold py-4 px-6 rounded-xl cursor-not-allowed text-lg"
                    disabled
                  >
                    🚫 Sin stock disponible
                  </button>
                )}

                <Link
                  to="/productos"
                  className="block w-full bg-white text-musical-slate font-bold py-4 px-6 rounded-xl border-2 border-musical-slate hover:bg-musical-slate hover:text-white transition-all duration-200 text-center text-lg"
                >
                  ← Volver a productos
                </Link>
              </div>
            </div>
          </div>

          {/* Descripción completa */}
          {instrumento.descripcion && (
            <div className="border-t border-slate-200 p-8 lg:p-12">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-2xl font-bold text-musical-slate mb-6 flex items-center">
                  <span className="mr-3">📝</span>
                  Descripción detallada
                </h3>
                <div className="prose prose-lg max-w-none">
                  <p className="text-slate-600 leading-relaxed text-lg">
                    {instrumento.descripcion}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleInstrumentoPage;
