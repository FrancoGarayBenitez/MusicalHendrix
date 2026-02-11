import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { UserRol } from "../../types/auth";

type ProtectedRouteProps = {
  allowedRoles?: UserRol[];
};

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  console.log("[ProtectedRoute] path=", location.pathname, {
    isAuthenticated,
    user,
    allowedRoles,
  });

  // No autenticado o token inválido/expirado
  if (!isAuthenticated) {
    console.warn("[ProtectedRoute] Not authenticated → /login");
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Usuario inactivo
  if (!user?.activo) {
    console.warn("[ProtectedRoute] User inactive → /login");
    return <Navigate to="/login" replace />;
  }

  // Chequeo de rol
  if (allowedRoles?.length) {
    const hasRole =
      allowedRoles.includes(user.rol) ||
      (allowedRoles.includes(UserRol.ADMIN) && isAdmin);
    if (!hasRole) {
      console.warn("[ProtectedRoute] Access denied → /acceso-denegado");
      return <Navigate to="/acceso-denegado" replace />;
    }
  }

  // Todo OK
  return <Outlet />;
};

export default ProtectedRoute;
