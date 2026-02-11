import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { adminUserService } from "../service/adminUserService";
import { UserRol, Usuario } from "../types/auth";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/common/Loading";
import "./AdminStyles.css";

const GestionUsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const { user, isAuthenticated, isAdmin } = useAuth();

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

  // ✅ Carga inicial de usuarios
  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("📥 Cargando usuarios del sistema...");

      const data = await adminUserService.getAllUsers();

      console.log("✅ Usuarios cargados:", data.length);
      setUsuarios(data);
    } catch (err) {
      console.error("❌ Error al cargar usuarios:", err);
      setError("Error al cargar usuarios. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Manejar cambio de rol
  const handleRoleChange = async (userId: number, newRole: UserRol) => {
    if (userId === user?.id) {
      alert("⚠️ No puedes cambiar tu propio rol");
      return;
    }

    const usuario = usuarios.find((u) => u.id === userId);
    if (!usuario) {
      console.error("❌ Usuario no encontrado:", userId);
      return;
    }

    // Evita quitar el último ADMIN activo
    const adminActivos = usuarios.filter(
      (u) => u.rol === UserRol.ADMIN && u.activo,
    );
    if (
      usuario.rol === UserRol.ADMIN &&
      newRole === UserRol.USER &&
      adminActivos.length <= 1
    ) {
      alert("⚠️ No puedes quitar el rol ADMIN al último administrador activo.");
      return;
    }

    const confirmacion = window.confirm(
      `¿Estás seguro de cambiar el rol de "${usuario.nombre} ${usuario.apellido}" a ${newRole}?`,
    );

    if (!confirmacion) {
      console.log("🚫 Cambio de rol cancelado por el usuario");
      return;
    }

    try {
      setUpdatingUserId(userId);
      setError(null);

      console.log(`🔄 Actualizando rol del usuario ${userId} → ${newRole}`);

      const updatedUser = await adminUserService.updateUser(userId, {
        rol: newRole,
        activo: usuario.activo,
      });

      console.log("✅ Rol actualizado:", updatedUser);

      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? updatedUser : u)),
      );

      setSuccess(`✅ Rol actualizado a ${newRole} correctamente`);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("❌ Error al cambiar rol:", err);
      setError("Error al cambiar el rol. Por favor, intenta nuevamente.");

      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ✅ Manejar cambio de estado (activo/inactivo)
  const handleStatusChange = async (userId: number, newStatus: boolean) => {
    if (userId === user?.id) {
      alert("⚠️ No puedes cambiar tu propio estado");
      return;
    }

    const usuario = usuarios.find((u) => u.id === userId);
    if (!usuario) {
      console.error("❌ Usuario no encontrado:", userId);
      return;
    }

    const accion = newStatus ? "habilitar" : "deshabilitar";
    const confirmacion = window.confirm(
      `¿Estás seguro de ${accion} a "${usuario.nombre} ${usuario.apellido}"?\n\n${!newStatus ? "⚠️ Este usuario no podrá acceder al sistema." : ""}`,
    );

    if (!confirmacion) {
      console.log("🚫 Cambio de estado cancelado por el usuario");
      return;
    }

    try {
      setUpdatingUserId(userId);
      setError(null);

      console.log(
        `🔄 Actualizando estado del usuario ${userId} → ${newStatus ? "Activo" : "Inactivo"}`,
      );

      const updatedUser = await adminUserService.updateUser(userId, {
        rol: usuario.rol,
        activo: newStatus,
      });

      console.log("✅ Estado actualizado:", updatedUser);

      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? updatedUser : u)),
      );

      setSuccess(
        `✅ Usuario ${newStatus ? "habilitado" : "deshabilitado"} exitosamente`,
      );

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("❌ Error al cambiar estado:", err);
      setError("Error al cambiar el estado. Por favor, intenta nuevamente.");

      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ✅ Verificar si es el usuario actual
  const isCurrentUser = (userId: number): boolean => {
    return userId === user?.id;
  };

  if (loading && usuarios.length === 0) {
    return <Loading message="Cargando usuarios..." />;
  }

  return (
    <div className="admin-page">
      {/* Header de la página */}
      <div className="page-header">
        <h1>👥 Gestión de Usuarios</h1>
        <p>Administración de usuarios y roles del sistema</p>
        <div className="admin-info">
          <span className="admin-user">
            👤 {user.email} <span className="role-badge admin">ADMIN</span>
          </span>
        </div>
      </div>

      {/* Mensajes de feedback */}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      {/* Lista de usuarios */}
      <div className="users-section">
        <div className="section-header">
          <h2>Usuarios del Sistema ({usuarios.length})</h2>
          <button
            onClick={loadUsuarios}
            className="btn-refresh"
            disabled={loading}
          >
            🔄 Actualizar
          </button>
        </div>

        {usuarios.length === 0 ? (
          <div className="no-data">
            <p>📭 No hay usuarios registrados en el sistema.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre Completo</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => {
                  const isCurrent = isCurrentUser(usuario.id);
                  const isUpdating = updatingUserId === usuario.id;

                  return (
                    <tr
                      key={usuario.id}
                      className={`${!usuario.activo ? "inactive-row" : ""} ${isCurrent ? "current-user-row" : ""}`}
                    >
                      <td>{usuario.id}</td>
                      <td className="user-name-cell">
                        {`${usuario.nombre} ${usuario.apellido}`}
                        {isCurrent && (
                          <span className="current-user-badge">TÚ</span>
                        )}
                      </td>
                      <td>{usuario.email}</td>
                      <td>
                        {isCurrent ? (
                          <span
                            className={`role-badge ${usuario.rol.toLowerCase()}`}
                          >
                            {usuario.rol}
                          </span>
                        ) : (
                          <select
                            value={usuario.rol}
                            onChange={(e) =>
                              handleRoleChange(
                                usuario.id,
                                e.target.value as UserRol,
                              )
                            }
                            className="role-select"
                            disabled={isUpdating}
                          >
                            <option value={UserRol.USER}>USER</option>
                            <option value={UserRol.ADMIN}>ADMIN</option>
                          </select>
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${usuario.activo ? "active" : "inactive"}`}
                        >
                          {usuario.activo ? "✅ Activo" : "❌ Inactivo"}
                        </span>
                      </td>
                      <td>
                        {isCurrent ? (
                          <span className="no-action">
                            No puedes modificar tu propio usuario
                          </span>
                        ) : (
                          <button
                            className={`btn btn-sm ${usuario.activo ? "btn-warning" : "btn-success"}`}
                            onClick={() =>
                              handleStatusChange(usuario.id, !usuario.activo)
                            }
                            disabled={isUpdating}
                          >
                            {isUpdating
                              ? "⏳ Actualizando..."
                              : usuario.activo
                                ? "🚫 Deshabilitar"
                                : "✅ Habilitar"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionUsuariosPage;
