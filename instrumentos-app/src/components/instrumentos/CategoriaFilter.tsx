import { useCategorias } from "../../hooks/useCategorias";
import { Categoria } from "../../types/types";

interface CategoriaFilterProps {
  selectedCategoriaId: number | null;
  onCategoriaChange: (categoriaId: number | null) => void;
}

const CategoriaFilter = ({
  selectedCategoriaId,
  onCategoriaChange,
}: CategoriaFilterProps) => {
  const { categorias, loading, error } = useCategorias();

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onCategoriaChange(value ? parseInt(value) : null);
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-3 text-musical-teal">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-musical-teal"></div>
        <span className="text-sm font-medium">Cargando categorías...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-500 text-sm">
        <span>❌</span>
        <span>Error al cargar categorías</span>
      </div>
    );
  }

  return (
    <div className="categoria-filter space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label
          htmlFor="categoria-select"
          className="text-sm font-medium text-musical-slate whitespace-nowrap"
        >
          Filtrar por categoría:
        </label>

        <div className="relative flex-1 max-w-xs">
          <select
            id="categoria-select"
            value={selectedCategoriaId?.toString() || ""}
            onChange={handleCategoriaChange}
            className="w-full appearance-none bg-white border-2 border-slate-200 text-musical-slate px-4 py-2.5 pr-10 rounded-lg shadow-sm focus:border-musical-teal focus:ring-4 focus:ring-musical-teal/10 transition-all duration-200 text-sm font-medium cursor-pointer hover:border-slate-300"
          >
            <option value="">📁 Todas las categorías</option>
            {categorias.map((categoria: Categoria) => (
              <option
                key={categoria.idCategoriaInstrumento}
                value={categoria.idCategoriaInstrumento.toString()}
              >
                🎵 {categoria.denominacion}
              </option>
            ))}
          </select>

          {/* Icono dropdown customizado */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Indicador de filtro activo */}
      {selectedCategoriaId && (
        <div className="flex items-center space-x-2 text-xs text-musical-teal font-medium">
          <span>🔍</span>
          <span>
            Filtrando por:{" "}
            {
              categorias.find(
                (c) => c.idCategoriaInstrumento === selectedCategoriaId,
              )?.denominacion
            }
          </span>
          <button
            onClick={() => onCategoriaChange(null)}
            className="ml-2 text-slate-400 hover:text-red-500 transition-colors"
            title="Limpiar filtro"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoriaFilter;
