import { useState, FormEvent, useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPages.css";

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
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">🎸 Iniciar Sesión</h1>
          <p className="auth-subtitle">Bienvenido a Musical Hendrix</p>
        </div>

        {/* Mensajes de error */}
        {(error || authError) && (
          <div className="auth-error" role="alert">
            {error || authError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="clave">Contraseña *</label>
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
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "⏳ Iniciando sesión..." : "🔓 Iniciar Sesión"}
          </button>
        </form>

        <div className="auth-links">
          <p>
            ¿No tienes una cuenta?{" "}
            <Link to="/registro" className="auth-link">
              Regístrate aquí
            </Link>
          </p>
          <p>
            ¿Olvidaste tu contraseña?{" "}
            <Link to="/forgot-password" className="auth-link">
              Recupérala aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
