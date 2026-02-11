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

  return (
    <div className="detalle-instrumento">
      <div className="breadcrumbs">
        <Link to="/productos">Productos</Link> / {instrumento.denominacion}
      </div>

      <div className="detalle-container">
        <div className="detalle-imagen">
          <img
            src={`/images/${instrumento.imagen}`}
            alt={instrumento.denominacion}
          />
        </div>

        <div className="detalle-info">
          <h1 className="detalle-titulo">{instrumento.denominacion}</h1>

          <div className="detalle-meta">
            <p>
              <strong>Marca:</strong> {instrumento.marca}
            </p>
            <p>
              <strong>Categoría:</strong>{" "}
              {instrumento.categoriaInstrumento.denominacion}
            </p>
            <p>
              <strong>Stock disponible:</strong> {instrumento.stock}
            </p>
          </div>

          {instrumento.precioActual && (
            <div className="detalle-precio">
              ${instrumento.precioActual.toLocaleString()}
            </div>
          )}

          <div className="detalle-stock">
            {instrumento.stock > 0 ? (
              <p className="stock-disponible">
                <span className="icon">✅</span> Disponible ({instrumento.stock}{" "}
                en stock)
              </p>
            ) : (
              <p className="sin-stock">
                <span className="icon">❌</span> Sin stock
              </p>
            )}
          </div>

          <div className="detalle-actions">
            {instrumento.stock > 0 && (
              <BotonAgregarCarrito
                instrumento={instrumento}
                showQuantity={true}
              />
            )}
            {instrumento.stock === 0 && (
              <button className="btn btn-disabled" disabled>
                Sin stock disponible
              </button>
            )}
          </div>

          <div className="detalle-descripcion">
            <h3>Descripción:</h3>
            <p>{instrumento.descripcion}</p>
          </div>

          <Link to="/productos" className="back-link">
            ← Volver a productos
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DetalleInstrumentoPage;
