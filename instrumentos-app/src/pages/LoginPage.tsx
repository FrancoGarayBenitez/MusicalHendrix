import { useState, FormEvent, useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const {
    login,
    error: authError,
    clearError,
    isAuthenticated,
    isAdmin,
  } = useAuth();

  // ✅ Si ya está autenticado, redirigir según rol
  if (isAuthenticated) {
    console.log("✅ Usuario ya autenticado, redirigiendo...");
    return <Navigate to={isAdmin ? "/admin" : "/"} replace />;
  }

  const [formData, setFormData] = useState({
    email: "",
    clave: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Limpiar errores al desmontar
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (authError) clearError();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // ✅ Validación de campos vacíos
    if (!formData.email.trim() || !formData.clave) {
      setError("❌ Por favor completa todos los campos");
      return;
    }

    // ✅ Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("❌ Por favor ingrese un email válido");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🔐 Iniciando sesión...", {
        email: formData.email.trim(),
      });

      const response = await login({
        email: formData.email.trim().toLowerCase(),
        clave: formData.clave,
      });

      if (response.success && response.activo) {
        console.log("✅ Login exitoso, redirigiendo...");

        // ✅ Redirigir según rol
        if (response.rol === "ADMIN") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else if (!response.activo) {
        setError("❌ Tu cuenta está deshabilitada. Contacta al administrador.");
      }
    } catch (err) {
      console.error("❌ Error al iniciar sesión:", err);
      // El error ya viene del AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header con logo */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">🎸</span>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-musical-slate to-musical-teal bg-clip-text text-transparent">
                Musical Hendrix
              </h1>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-musical-slate mb-2">
            Iniciar Sesión
          </h2>
          <p className="text-slate-600">Bienvenido de nuevo</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
          {/* Mensajes de error */}
          {(error || authError) && (
            <div
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium"
              role="alert"
            >
              {error || authError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                placeholder="ejemplo@email.com"
                required
                autoComplete="email"
                autoFocus
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-musical-teal focus:ring-4 focus:ring-musical-teal/10 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="clave"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Contraseña *
              </label>
              <input
                type="password"
                id="clave"
                name="clave"
                value={formData.clave}
                onChange={handleChange}
                disabled={loading}
                placeholder="Ingresa tu contraseña"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-musical-teal focus:ring-4 focus:ring-musical-teal/10 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-musical-teal to-musical-slate text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-4 focus:ring-musical-teal/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                "🔓 Iniciar Sesión"
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center text-sm space-y-3">
            <p className="text-slate-600">
              ¿No tienes una cuenta?{" "}
              <Link
                to="/registro"
                className="text-musical-teal font-semibold hover:text-musical-slate transition-colors"
              >
                Regístrate aquí
              </Link>
            </p>
            <p className="text-slate-600">
              ¿Olvidaste tu contraseña?{" "}
              <Link
                to="/forgot-password"
                className="text-musical-teal font-semibold hover:text-musical-slate transition-colors"
              >
                Recupérala aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
