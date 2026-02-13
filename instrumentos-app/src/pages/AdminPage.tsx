import { useState } from "react";
import { Instrumento, FormState } from "../types/types";
import { useInstrumentos } from "../hooks/useInstrumentos";
import { updateInstrumentPrice, updateInstrumentStock } from "../service/api";
import InstrumentoGridAdmin from "../components/instrumentos/InstrumentoGridAdmin";
import InstrumentoForm from "../components/instrumentos/InstrumentoForm";
import Loading from "../components/common/Loading";
import Error from "../components/common/Error";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

const AdminPage = () => {
  const {
    instrumentos,
    loading,
    error,
    selectedCategoriaId,
    filterByCategoria,
    addInstrumento,
    editInstrumento,
    removeInstrumento,
    refreshInstrumentos,
  } = useInstrumentos();

  const { user, isAuthenticated, isAdmin } = useAuth();

  const [showForm, setShowForm] = useState<boolean>(false);
  const [currentInstrumento, setCurrentInstrumento] = useState<
    Instrumento | undefined
  >(undefined);
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    isSuccess: false,
    isError: false,
    message: "",
  });

  // ✅ PROTECCIÓN: Solo admin puede acceder
  if (!isAuthenticated) {
    console.warn("⚠️ Usuario no autenticado. Redirigiendo a login...");
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    console.warn("⚠️ Usuario sin permisos de admin. Redirigiendo a home...");
    return <Navigate to="/" replace />;
  }

  if (!user?.activo) {
    console.warn("⚠️ Usuario inactivo. Redirigiendo a login...");
    return <Navigate to="/login" replace />;
  }

  console.log("🔐 Usuario admin autenticado:", {
    email: user.email,
    rol: user.rol,
    activo: user.activo,
  });

  // ✅ Formulario para crear nuevo instrumento
  const handleAdd = () => {
    console.log("➕ Abriendo formulario para crear instrumento");
    setCurrentInstrumento(undefined);
    setShowForm(true);
    setFormState({
      isSubmitting: false,
      isSuccess: false,
      isError: false,
      message: "",
    });
  };

  // ✅ Formulario para editar instrumento existente
  const handleEdit = (instrumento: Instrumento) => {
    console.log(
      "✏️ Abriendo formulario para editar:",
      instrumento.denominacion,
    );
    setCurrentInstrumento(instrumento);
    setShowForm(true);
    setFormState({
      isSubmitting: false,
      isSuccess: false,
      isError: false,
      message: "",
    });
  };

  // ✅ Cerrar el formulario
  const handleCancel = () => {
    console.log("❌ Cancelando formulario");
    setShowForm(false);
    setCurrentInstrumento(undefined);
  };

  // ✅ Guardar el instrumento (crear o actualizar)
  const handleSubmit = async (data: Omit<Instrumento, "idInstrumento">) => {
    setFormState((prev) => ({
      ...prev,
      isSubmitting: true,
      isError: false,
      isSuccess: false,
      message: "",
    }));

    try {
      console.log("💾 Guardando instrumento...", data);

      if (currentInstrumento?.idInstrumento) {
        // ✅ ACTUALIZAR instrumento existente
        const instrumentoId = currentInstrumento.idInstrumento;
        console.log("✏️ Actualizando instrumento ID:", instrumentoId);

        const result = await editInstrumento(instrumentoId.toString(), data);

        if (!result) {
          setFormState({
            isSubmitting: false,
            isSuccess: false,
            isError: true,
            message: "❌ No se pudo actualizar el instrumento",
          });
          return;
        }

        console.log("✅ Instrumento actualizado:", result);

        setFormState({
          isSubmitting: false,
          isSuccess: true,
          isError: false,
          message: "✅ Instrumento actualizado correctamente",
        });
      } else {
        // ✅ CREAR nuevo instrumento
        console.log("➕ Creando nuevo instrumento");

        const result = await addInstrumento(data);

        if (!result) {
          setFormState({
            isSubmitting: false,
            isSuccess: false,
            isError: true,
            message: "❌ No se pudo crear el instrumento",
          });
          return;
        }

        console.log("✅ Instrumento creado:", result);

        setFormState({
          isSubmitting: false,
          isSuccess: true,
          isError: false,
          message: "✅ Instrumento creado correctamente",
        });
      }

      // ✅ Cerrar formulario después de 1.5s
      setTimeout(() => {
        setShowForm(false);
        setCurrentInstrumento(undefined);
        setFormState((prev) => ({ ...prev, isSuccess: false, message: "" }));
      }, 1500);
    } catch (err) {
      console.error("❌ Error al guardar instrumento:", err);

      setFormState({
        isSubmitting: false,
        isSuccess: false,
        isError: true,
        message: "❌ Error al guardar el instrumento",
      });

      setTimeout(() => {
        setFormState((prev) => ({ ...prev, isError: false, message: "" }));
      }, 5000);
    }
  };

  // ✅ Eliminar un instrumento
  const handleDelete = async (id: string | number) => {
    try {
      const instrumentoId = typeof id === "number" ? id : parseInt(id);

      // ✅ Confirmar eliminación
      const instrumento = instrumentos.find(
        (i) => i.idInstrumento === instrumentoId,
      );

      if (!instrumento) {
        console.error("❌ Instrumento no encontrado:", instrumentoId);
        return;
      }

      const confirmDelete = window.confirm(
        `¿Estás seguro de eliminar "${instrumento.denominacion}"?\n\nEsta acción no se puede deshacer.`,
      );

      if (!confirmDelete) {
        console.log("🚫 Eliminación cancelada por el usuario");
        return;
      }

      console.log("🗑️ Eliminando instrumento:", instrumentoId);

      const success = await removeInstrumento(id.toString());

      if (success) {
        setFormState({
          isSubmitting: false,
          isSuccess: true,
          isError: false,
          message: "✅ Instrumento eliminado correctamente",
        });

        setTimeout(() => {
          setFormState((prev) => ({ ...prev, isSuccess: false, message: "" }));
        }, 3000);
      } else {
        setFormState({
          isSubmitting: false,
          isSuccess: false,
          isError: true,
          message: "❌ No se pudo eliminar el instrumento",
        });
      }
    } catch (err) {
      console.error("❌ Error al eliminar instrumento:", err);

      setFormState({
        isSubmitting: false,
        isSuccess: false,
        isError: true,
        message: "❌ Error al eliminar el instrumento",
      });

      setTimeout(() => {
        setFormState((prev) => ({ ...prev, isError: false, message: "" }));
      }, 5000);
    }
  };

  // ✅ Actualizar precio específico
  const handlePriceUpdate = async (
    instrumentoId: number,
    nuevoPrecio: number,
  ) => {
    try {
      console.log(
        `💰 Actualizando precio del instrumento ${instrumentoId} → $${nuevoPrecio}`,
      );

      // ✅ Validar precio
      if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
        setFormState({
          isSubmitting: false,
          isSuccess: false,
          isError: true,
          message: "❌ El precio debe ser mayor a 0",
        });
        return;
      }

      // ✅ Usar función específica para actualizar precio
      await updateInstrumentPrice(instrumentoId, nuevoPrecio);

      console.log("✅ Precio actualizado correctamente");

      // ✅ Refrescar lista de instrumentos
      await refreshInstrumentos(true);

      setFormState({
        isSubmitting: false,
        isSuccess: true,
        isError: false,
        message: `✅ Precio actualizado a $${nuevoPrecio.toLocaleString("es-AR")}`,
      });

      setTimeout(() => {
        setFormState((prev) => ({ ...prev, isSuccess: false, message: "" }));
      }, 3000);
    } catch (err) {
      console.error("❌ Error al actualizar precio:", err);

      setFormState({
        isSubmitting: false,
        isSuccess: false,
        isError: true,
        message: "❌ Error al actualizar el precio",
      });

      setTimeout(() => {
        setFormState((prev) => ({ ...prev, isError: false, message: "" }));
      }, 5000);
    }
  };

  // ✅ Actualizar stock específico
  const handleStockUpdate = async (instrumentoId: number, cantidad: number) => {
    try {
      console.log(
        `📦 Actualizando stock del instrumento ${instrumentoId} → ${cantidad} unidades`,
      );

      // ✅ Validar cantidad
      if (isNaN(cantidad) || cantidad < 0) {
        setFormState({
          isSubmitting: false,
          isSuccess: false,
          isError: true,
          message: "❌ La cantidad debe ser mayor o igual a 0",
        });
        return;
      }

      // ✅ Usar función específica para actualizar stock
      await updateInstrumentStock(instrumentoId, cantidad);

      console.log("✅ Stock actualizado correctamente");

      // ✅ Refrescar lista de instrumentos
      await refreshInstrumentos(true);

      setFormState({
        isSubmitting: false,
        isSuccess: true,
        isError: false,
        message: `✅ Stock actualizado a ${cantidad} ${cantidad === 1 ? "unidad" : "unidades"}`,
      });

      setTimeout(() => {
        setFormState((prev) => ({ ...prev, isSuccess: false, message: "" }));
      }, 3000);
    } catch (err) {
      console.error("❌ Error al actualizar stock:", err);

      setFormState({
        isSubmitting: false,
        isSuccess: false,
        isError: true,
        message: "❌ Error al actualizar el stock",
      });

      setTimeout(() => {
        setFormState((prev) => ({ ...prev, isError: false, message: "" }));
      }, 5000);
    }
  };

  // ✅ Mostrar loading mientras carga
  if (loading && instrumentos.length === 0) {
    return <Loading message="Cargando instrumentos..." />;
  }

  // ✅ Mostrar error si falla la carga y no hay formulario abierto
  if (error && !showForm) {
    return <Error message={error} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header de la página */}
      <div className="bg-gradient-to-r from-musical-slate via-musical-teal to-musical-slate py-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-6 left-10 w-24 h-24 bg-white rounded-full blur-2xl"></div>
          <div className="absolute bottom-6 right-10 w-20 h-20 bg-white rounded-full blur-2xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-3xl">🎸</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                  Panel de Administración
                </h1>
                <p className="text-white/80 text-lg">
                  Gestiona los instrumentos musicales de la tienda
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                <div className="flex items-center space-x-2 text-white">
                  <span className="text-sm">👤</span>
                  <span className="font-medium">{user.email}</span>
                  <span className="bg-emerald-400 text-emerald-900 px-3 py-1 rounded-lg text-xs font-bold">
                    ADMIN
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensajes de feedback */}
        {formState.isSuccess && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
            <div className="flex items-center space-x-2">
              <span className="text-green-400 text-lg">✅</span>
              <p className="text-green-800 font-medium">{formState.message}</p>
            </div>
          </div>
        )}

        {formState.isError && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex items-center space-x-2">
              <span className="text-red-400 text-lg">❌</span>
              <p className="text-red-800 font-medium">{formState.message}</p>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        {showForm ? (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <InstrumentoForm
              instrumento={currentInstrumento}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={formState.isSubmitting}
            />
          </div>
        ) : (
          <InstrumentoGridAdmin
            instrumentos={instrumentos}
            loading={loading}
            error={error}
            selectedCategoriaId={selectedCategoriaId}
            onFilterChange={filterByCategoria}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            onPriceUpdate={handlePriceUpdate}
            onStockUpdate={handleStockUpdate}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPage;
