import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { adminUserService } from "../service/adminUserService";
import { UserRol, Usuario } from "../types/auth";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/common/Loading";

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
                <span className="text-3xl">👥</span>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
                  Gestión de Usuarios
                </h1>
                <p className="text-white/80 text-lg">
                  Administración de usuarios y roles del sistema
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
        {error && (
          <div
            className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg"
            role="alert"
          >
            <div className="flex items-center space-x-2">
              <span className="text-red-400 text-lg">❌</span>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div
            className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg"
            role="alert"
          >
            <div className="flex items-center space-x-2">
              <span className="text-green-400 text-lg">✅</span>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Lista de usuarios */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-musical-slate flex items-center">
                  <span className="mr-3">👥</span>
                  Usuarios del Sistema ({usuarios.length})
                </h2>
                <p className="text-slate-600 mt-1">
                  Gestiona roles y estados de los usuarios
                </p>
              </div>

              <button
                onClick={loadUsuarios}
                className="inline-flex items-center bg-gradient-to-r from-musical-teal to-musical-slate text-white font-bold px-6 py-3 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                disabled={loading}
              >
                <span className="text-lg">🔄</span>
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {usuarios.length === 0 ? (
            <div className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-musical-slate mb-3">
                  No hay usuarios registrados
                </h3>
                <p className="text-slate-600 text-sm">
                  No hay usuarios registrados en el sistema.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Nombre Completo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => {
                    const isCurrent = isCurrentUser(usuario.id);
                    const isUpdating = updatingUserId === usuario.id;

                    return (
                      <tr
                        key={usuario.id}
                        className={`border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150 ${
                          !usuario.activo ? "bg-red-50/30" : ""
                        } ${isCurrent ? "bg-blue-50/50" : ""}`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-musical-slate">
                          {usuario.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-musical-slate">
                              {`${usuario.nombre} ${usuario.apellido}`}
                            </span>
                            {isCurrent && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                                TÚ
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {usuario.email}
                        </td>
                        <td className="px-6 py-4">
                          {isCurrent ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                usuario.rol === "ADMIN"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-800"
                              }`}
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
                              className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-musical-slate focus:border-musical-teal focus:ring-2 focus:ring-musical-teal/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              disabled={isUpdating}
                            >
                              <option value={UserRol.USER}>USER</option>
                              <option value={UserRol.ADMIN}>ADMIN</option>
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              usuario.activo
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {usuario.activo ? "✅ Activo" : "❌ Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isCurrent ? (
                            <span className="text-xs text-slate-500 italic">
                              No puedes modificar tu propio usuario
                            </span>
                          ) : (
                            <button
                              className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 space-x-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                                usuario.activo
                                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                                  : "bg-green-50 text-green-600 hover:bg-green-100"
                              }`}
                              onClick={() =>
                                handleStatusChange(usuario.id, !usuario.activo)
                              }
                              disabled={isUpdating}
                            >
                              <span>
                                {isUpdating
                                  ? "⏳"
                                  : usuario.activo
                                    ? "🚫"
                                    : "✅"}
                              </span>
                              <span>
                                {isUpdating
                                  ? "Actualizando..."
                                  : usuario.activo
                                    ? "Deshabilitar"
                                    : "Habilitar"}
                              </span>
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
    </div>
  );
};

export default GestionUsuariosPage;
