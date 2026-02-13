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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path
      ? "text-musical-teal border-musical-teal"
      : "text-slate-600 hover:text-musical-teal";
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setMobileMenuOpen(false);
  };

  const userRol: UserRol | undefined = user?.rol;

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-2xl font-bold text-musical-slate hover:text-musical-teal transition-colors"
            >
              Musical Hendrix
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-all ${isActive("/")}`}
              >
                Home
              </Link>

              <Link
                to="/productos"
                className={`px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-all ${isActive("/productos")}`}
              >
                Productos
              </Link>

              <Link
                to="/donde-estamos"
                className={`px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-all ${isActive("/donde-estamos")}`}
              >
                Donde Estamos
              </Link>

              {/* Mis Pedidos para usuarios autenticados (no admin) */}
              {isAuthenticated && userRol !== UserRol.ADMIN && (
                <Link
                  to="/mis-pedidos"
                  className={`px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-all ${isActive("/mis-pedidos")}`}
                >
                  Mis Pedidos
                </Link>
              )}

              {/* Menu desplegable para ADMIN */}
              {isAuthenticated && userRol === UserRol.ADMIN && (
                <div className="relative">
                  <button
                    className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-musical-teal transition-colors flex items-center"
                    onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  >
                    Administración
                    <svg
                      className="ml-1 h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {adminMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-musical-teal transition-colors"
                        onClick={() => setAdminMenuOpen(false)}
                      >
                        Gestión de Instrumentos
                      </Link>
                      <Link
                        to="/admin/usuarios"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-musical-teal transition-colors"
                        onClick={() => setAdminMenuOpen(false)}
                      >
                        Gestión de Usuarios
                      </Link>
                      <Link
                        to="/admin/pedidos"
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-musical-teal transition-colors"
                        onClick={() => setAdminMenuOpen(false)}
                      >
                        Gestión de Pedidos
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Auth & Cart */}
          <div className="hidden md:flex items-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-musical-teal px-3 py-2 text-sm font-medium transition-colors"
                >
                  Ingresar
                </Link>
                <Link
                  to="/registro"
                  className="!bg-musical-teal !text-white hover:!bg-musical-slate px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm !border-0"
                >
                  Registrarse
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  className="flex items-center text-slate-600 hover:text-musical-teal text-sm font-medium transition-colors"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  {user?.email}
                  <span className="ml-1 text-xs bg-slate-100 px-2 py-1 rounded-full">
                    {userRol}
                  </span>
                  <svg
                    className="ml-1 h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-musical-red transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            )}

            <CarritoIcon />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <CarritoIcon />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 hover:text-musical-teal p-2"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 pt-4 pb-3 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-musical-teal border-l-4 border-transparent hover:border-musical-teal transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/productos"
              className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-musical-teal border-l-4 border-transparent hover:border-musical-teal transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Productos
            </Link>
            <Link
              to="/donde-estamos"
              className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-musical-teal border-l-4 border-transparent hover:border-musical-teal transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Donde Estamos
            </Link>

            {isAuthenticated && userRol !== UserRol.ADMIN && (
              <Link
                to="/mis-pedidos"
                className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-musical-teal border-l-4 border-transparent hover:border-musical-teal transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mis Pedidos
              </Link>
            )}

            {/* Mobile Auth Section */}
            <div className="border-t border-slate-200 pt-4">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-musical-teal"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Ingresar
                  </Link>
                  <Link
                    to="/registro"
                    className="block px-3 py-2 text-base font-medium text-musical-teal"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-musical-red"
                >
                  Cerrar Sesión ({user?.email})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
