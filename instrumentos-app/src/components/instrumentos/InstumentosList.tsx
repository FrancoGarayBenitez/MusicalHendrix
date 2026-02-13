import React from "react";
import InstrumentoCard from "./InstrumentoCard";
import { Instrumento } from "../../types/types";
import Loading from "../common/Loading";
import Error from "../common/Error";

interface InstrumentosListProps {
  instrumentos: Instrumento[];
  loading: boolean;
  error: string | null;
}

const InstrumentosList: React.FC<InstrumentosListProps> = ({
  instrumentos,
  loading,
  error,
}) => {
  if (loading) return <Loading />;
  if (error) return <Error message={error} />;

  if (instrumentos.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-6">🎸</div>
          <h3 className="text-2xl font-bold text-musical-slate mb-4">
            No hay instrumentos disponibles
          </h3>
          <p className="text-slate-600 mb-6">
            No encontramos instrumentos que coincidan con los filtros
            seleccionados.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center bg-musical-teal text-white font-semibold px-6 py-3 rounded-lg hover:bg-musical-slate transition-colors duration-200"
          >
            <span className="mr-2">🔄</span>
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {instrumentos.map((instrumento) => (
        <InstrumentoCard
          key={instrumento.idInstrumento}
          instrumento={instrumento}
        />
      ))}
    </div>
  );
};

export default InstrumentosList;
