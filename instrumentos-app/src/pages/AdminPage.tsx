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
import "./AdminStyles.css";

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
    <div className="admin-page">
      {/* Header de la página */}
      <div className="page-header">
        <h1>🎸 Panel de Administración</h1>
        <p>Gestiona los instrumentos musicales de la tienda</p>
        <div className="admin-info">
          <span className="admin-user">
            👤 {user.email} <span className="role-badge admin">ADMIN</span>
          </span>
        </div>
      </div>

      {/* Mensajes de feedback */}
      {formState.isSuccess && (
        <div className="alert alert-success" role="alert">
          {formState.message}
        </div>
      )}

      {formState.isError && (
        <div className="alert alert-error" role="alert">
          {formState.message}
        </div>
      )}

      {/* Formulario o grilla de instrumentos */}
      {showForm ? (
        <div className="form-container">
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
  );
};

export default AdminPage;
