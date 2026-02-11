import { useState, useEffect, useCallback } from "react";
import { Instrumento } from "../types/types";
import {
  fetchInstrumentos,
  fetchInstrumentosByCategoria,
  fetchInstrumentoById,
  createInstrumento,
  updateInstrumento,
  deleteInstrumento,
} from "../service/api";

export const useInstrumentos = () => {
  const [instrumentos, setInstrumentos] = useState<Instrumento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | null>(
    null,
  );
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Carga los instrumentos al iniciar
  const loadInstrumentos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Instrumento[];

      if (selectedCategoriaId) {
        console.log(
          `📂 Cargando instrumentos de categoría: ${selectedCategoriaId}`,
        );
        data = await fetchInstrumentosByCategoria(selectedCategoriaId);
      } else {
        console.log("📂 Cargando todos los instrumentos");
        data = await fetchInstrumentos();
      }

      console.log(`✅ ${data.length} instrumentos cargados`);
      setInstrumentos(data);
    } catch (err) {
      const errorMessage = "Error al cargar los instrumentos";
      setError(errorMessage);
      console.error("❌", errorMessage, err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoriaId, refreshCounter]);

  // Filtra los instrumentos por categoría
  const filterByCategoria = useCallback((categoriaId: number | null) => {
    console.log(
      `🔍 Filtrando por categoría: ${categoriaId || "todas las categorías"}`,
    );
    setSelectedCategoriaId(categoriaId);
  }, []);

  // Método para refrescar los instrumentos
  const refreshInstrumentos = useCallback(
    (forceRefresh = false) => {
      if (forceRefresh) {
        console.log("🔄 Forzando actualización de instrumentos");
        setRefreshCounter((prev) => prev + 1);
      } else {
        loadInstrumentos();
      }
    },
    [loadInstrumentos],
  );

  // Obtener instrumento por ID
  const getInstrumentoById = useCallback(
    async (id: string): Promise<Instrumento | null> => {
      try {
        setLoading(true);
        setError(null);
        console.log(`🔍 Buscando instrumento con ID: ${id}`);

        const data = await fetchInstrumentoById(id);
        console.log("✅ Instrumento encontrado:", data.denominacion);
        return data;
      } catch (err) {
        const errorMessage = "Error al cargar el instrumento";
        setError(errorMessage);
        console.error("❌", errorMessage, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Crear nuevo instrumento
  const addInstrumento = useCallback(
    async (
      instrumento: Omit<Instrumento, "idInstrumento">,
    ): Promise<Instrumento | null> => {
      try {
        setLoading(true);
        setError(null);
        console.log("📝 Creando nuevo instrumento:", instrumento.denominacion);

        const newInstrumento = await createInstrumento(instrumento);
        console.log("✅ Instrumento creado exitosamente:", newInstrumento);

        // Refrescar lista
        refreshInstrumentos(true);
        return newInstrumento;
      } catch (err) {
        const errorMessage = "Error al crear el instrumento";
        setError(errorMessage);
        console.error("❌", errorMessage, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [refreshInstrumentos],
  );

  // Actualizar un instrumento
  const editInstrumento = useCallback(
    async (
      id: string,
      instrumento: Omit<Instrumento, "idInstrumento">,
    ): Promise<Instrumento | null> => {
      try {
        setLoading(true);
        setError(null);

        console.log("✏️ Editando instrumento con ID:", id);
        console.log("Datos a enviar:", instrumento);

        const updatedInstrumento = await updateInstrumento(id, instrumento);
        console.log("✅ Instrumento actualizado:", updatedInstrumento);

        // Refrescar lista
        refreshInstrumentos(true);

        return updatedInstrumento;
      } catch (err) {
        const errorMessage = "Error al actualizar el instrumento";
        console.error("❌", errorMessage, err);
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [refreshInstrumentos],
  );

  // Eliminar un instrumento
  const removeInstrumento = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);
        console.log("🗑️ Eliminando instrumento con ID:", id);

        await deleteInstrumento(id);
        console.log("✅ Instrumento eliminado exitosamente");

        // Refrescar lista
        refreshInstrumentos(true);
        return true;
      } catch (err) {
        const errorMessage = "Error al eliminar el instrumento";
        setError(errorMessage);
        console.error("❌", errorMessage, err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refreshInstrumentos],
  );

  // Cargar instrumentos al iniciar
  useEffect(() => {
    loadInstrumentos();
  }, [loadInstrumentos]);

  // Detectar pago exitoso y refrescar
  useEffect(() => {
    const paymentSuccess = localStorage.getItem("payment_success");

    if (paymentSuccess === "true") {
      console.log("💰 Detectado pago exitoso, actualizando instrumentos...");
      refreshInstrumentos(true);
      localStorage.removeItem("payment_success");
    }
  }, [refreshInstrumentos]);

  return {
    instrumentos,
    loading,
    error,
    selectedCategoriaId,
    filterByCategoria,
    getInstrumentoById,
    addInstrumento,
    editInstrumento,
    removeInstrumento,
    refreshInstrumentos,
  };
};
