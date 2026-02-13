import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import InstrumentosList from "../components/instrumentos/InstumentosList";
import CategoriaFilter from "../components/instrumentos/CategoriaFilter";
import { useInstrumentos } from "../hooks/useInstrumentos";

const ProductosPage = () => {
  const {
    instrumentos,
    loading,
    error,
    selectedCategoriaId,
    filterByCategoria,
    refreshInstrumentos,
  } = useInstrumentos();

  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ Detectar pago exitoso desde query params
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");

    if (paymentStatus === "success") {
      console.log("✅ Pago exitoso detectado en ProductosPage");

      // ✅ Refrescar lista de productos (puede haber cambios en stock)
      refreshInstrumentos(true);

      // ✅ Mostrar notificación
      alert("✅ ¡Pago procesado exitosamente! Tu pedido ha sido confirmado.");

      // ✅ Limpiar query params
      setSearchParams({});
    } else if (paymentStatus === "failure") {
      console.log("❌ Pago fallido detectado en ProductosPage");

      // ✅ Mostrar mensaje de error
      alert("❌ El pago no pudo ser procesado. Por favor, intenta nuevamente.");

      // ✅ Limpiar query params
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, refreshInstrumentos]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header de la página - Reducido */}
      <div className="bg-gradient-to-r from-musical-slate to-musical-teal py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-1 bg-gradient-to-r from-transparent to-white rounded-full"></div>
              <span className="text-2xl">🎵</span>
              <div className="w-8 h-1 bg-gradient-to-r from-white to-transparent rounded-full"></div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            Nuestros Productos
          </h1>

          <p className="text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            Explora nuestra amplia selección de instrumentos musicales de
            <span className="font-semibold"> alta calidad</span>
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Filtros */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h2 className="text-lg font-semibold text-musical-slate mb-4 flex items-center">
              <span className="mr-2">🔍</span>
              Filtrar por categoría
            </h2>
            <CategoriaFilter
              selectedCategoriaId={selectedCategoriaId}
              onCategoriaChange={filterByCategoria}
            />
          </div>
        </div>

        {/* Lista de productos */}
        <div className="productos-container">
          <InstrumentosList
            instrumentos={instrumentos}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductosPage;
