import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AccesoDenegadoPage.css";

const AccesoDenegadoPage = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="auth-page">
      <div className="auth-container access-denied-container">
        <div className="access-denied-icon">
          <span role="img" aria-label="Acceso denegado">
            🚫
          </span>
        </div>

        <h1 className="auth-title">Acceso Denegado</h1>

        <div className="auth-error" role="alert">
          No tienes permisos suficientes para acceder a esta página.
        </div>

        <div className="access-denied-details">
          {isAuthenticated && user ? (
            <p>
              Tu rol actual es <strong>{user.rol}</strong> y se requiere un rol
              superior para acceder a esta sección.
            </p>
          ) : (
            <p>Debes iniciar sesión para acceder a esta página.</p>
          )}
        </div>

        <div className="access-denied-actions">
          <Link to="/" className="btn-primary">
            🏠 Volver al inicio
          </Link>

          {!isAuthenticated && (
            <Link to="/login" className="btn-secondary">
              🔐 Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccesoDenegadoPage;
