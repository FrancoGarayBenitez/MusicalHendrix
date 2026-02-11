import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CarritoIcon from "../carrito/CarritoIcon";
import { useCarritoContext } from "../../context/CarritoContext";
import { UserRol } from "../../types/auth";

const Navbar = () => {
  const location = useLocation();
  const { totalItems } = useCarritoContext();
  const { user, isAuthenticated, logout } = useAuth();

  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path ? "active-link" : "";
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  // Rol del usuario (ADMIN | USER)
  const userRol: UserRol | undefined = user?.rol;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          Musical Hendrix
        </Link>
      </div>

      <ul className="navbar-menu">
        <li className="navbar-item">
          <Link to="/" className={`navbar-link ${isActive("/")}`}>
            Home
          </Link>
        </li>
        <li className="navbar-item">
          <Link
            to="/productos"
            className={`navbar-link ${isActive("/productos")}`}
          >
            Productos
          </Link>
        </li>
        <li className="navbar-item">
          <Link
            to="/donde-estamos"
            className={`navbar-link ${isActive("/donde-estamos")}`}
          >
            Donde Estamos
          </Link>
        </li>

        {/* Mis Pedidos para usuarios autenticados (no admin) */}
        {isAuthenticated && userRol !== UserRol.ADMIN && (
          <li className="navbar-item">
            <Link
              to="/mis-pedidos"
              className={`navbar-link ${isActive("/mis-pedidos")}`}
            >
              Mis Pedidos
            </Link>
          </li>
        )}

        {/* Menu desplegable para ADMIN */}
        {isAuthenticated && userRol === UserRol.ADMIN && (
          <li className="navbar-item dropdown">
            <button
              className="navbar-link dropdown-toggle"
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
            >
              Administración
              <span className="dropdown-icon">▼</span>
            </button>

            {adminMenuOpen && (
              <ul className="dropdown-menu admin-dropdown">
                <li>
                  <Link
                    to="/admin"
                    className={`navbar-link ${isActive("/admin")}`}
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    Gestión de Instrumentos
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/usuarios"
                    className={`navbar-link ${isActive("/admin/usuarios")}`}
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    Gestión de Usuarios
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/pedidos"
                    className={`navbar-link ${isActive("/admin/pedidos")}`}
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    Gestión de Pedidos
                  </Link>
                </li>
              </ul>
            )}
          </li>
        )}

        {/* Enlaces de autenticación */}
        {!isAuthenticated ? (
          <>
            <li className="navbar-item">
              <Link to="/login" className={`navbar-link ${isActive("/login")}`}>
                Ingresar
              </Link>
            </li>
            <li className="navbar-item">
              <Link
                to="/registro"
                className={`navbar-link ${isActive("/registro")}`}
              >
                Registrarse
              </Link>
            </li>
          </>
        ) : (
          <li className="navbar-item dropdown">
            <button
              className="navbar-link dropdown-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {user?.email} ({userRol})<span className="dropdown-icon">▼</span>
            </button>

            {menuOpen && (
              <ul className="dropdown-menu">
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Cerrar Sesión
                  </button>
                </li>
              </ul>
            )}
          </li>
        )}
      </ul>

      <CarritoIcon />
    </nav>
  );
};

export default Navbar;
