import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import InstrumentosList from "../components/instrumentos/InstumentosList";
import CategoriaFilter from "../components/instrumentos/CategoriaFilter";
import { useInstrumentos } from "../hooks/useInstrumentos";
import "./ProductosPage.css";

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
    <div className="productos-page">
      <div className="page-header">
        <h1>🎵 Nuestros Productos</h1>
        <p>
          Explora nuestra amplia selección de instrumentos musicales de alta
          calidad
        </p>
      </div>

      <div className="filter-container">
        <CategoriaFilter
          selectedCategoriaId={selectedCategoriaId}
          onCategoriaChange={filterByCategoria}
        />
      </div>

      <div className="productos-container">
        <InstrumentosList
          instrumentos={instrumentos}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default ProductosPage;
