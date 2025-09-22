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

  //obtengo el rol como string
  const getUserRol = () => {
    if (!user?.rol) return "";
    //si rol es un objeto, usa su propiedad definicion
    if (typeof user.rol === "object" && "definicion" in user.rol) {
      return user.rol.definicion;
    }
    //si rol es un string, lo usa directamente
    return user.rol as string;
  };

  const userRol = getUserRol();

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

        {/* Mostrar Mis Pedidos para usuarios autenticados (no admin) */}
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

        {/* Menu para OPERADOR */}
        {isAuthenticated && userRol === UserRol.OPERADOR && (
          <li className="navbar-item">
            <Link to="/admin" className={`navbar-link ${isActive("/admin")}`}>
              Gestión de Instrumentos
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
                    className={isActive("/admin")}
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    Gestión de Instrumentos
                  </Link>
                </li>
                <li>
                  <Link
                    to="/gestion-usuarios"
                    className={isActive("/gestion-usuarios")}
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    Gestión de Usuarios
                  </Link>
                </li>
                <li>
                  <Link
                    to="/gestion-pedidos"
                    className={isActive("/gestion-pedidos")}
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    Gestión de Pedidos
                  </Link>
                </li>
              </ul>
            )}
          </li>
        )}

        {/* Enlaces de autenticacion */}
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

      {/* Icono del carrito */}
      <CarritoIcon />
    </nav>
  );
};

export default Navbar;
