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
      <div className="no-instrumentos">
        <p>No hay instrumentos disponibles.</p>
      </div>
    );
  }

  return (
    <div className="instrumentos-list">
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
