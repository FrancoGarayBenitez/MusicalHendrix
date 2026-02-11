import { useState, FormEvent } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRol } from "../types/auth";
import "./AuthPages.css";

const RegistroPage = () => {
  const navigate = useNavigate();
  const { register, error: authError, clearError, isAuthenticated } = useAuth();

  // ✅ Si ya está autenticado, redirigir
  if (isAuthenticated) {
    console.log("✅ Usuario ya autenticado, redirigiendo...");
    return <Navigate to="/" replace />;
  }

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    clave: "",
    confirmarClave: "",
    rol: UserRol.USER, // ✅ Siempre USER para nuevos registros
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (authError) clearError();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // ✅ Validación de campos vacíos
    if (
      !formData.nombre.trim() ||
      !formData.apellido.trim() ||
      !formData.email.trim() ||
      !formData.clave ||
      !formData.confirmarClave
    ) {
      setError("❌ Por favor complete todos los campos");
      return;
    }

    // ✅ Validación de longitud de nombre y apellido
    if (formData.nombre.trim().length < 2) {
      setError("❌ El nombre debe tener al menos 2 caracteres");
      return;
    }

    if (formData.apellido.trim().length < 2) {
      setError("❌ El apellido debe tener al menos 2 caracteres");
      return;
    }

    // ✅ Validación de contraseñas
    if (formData.clave !== formData.confirmarClave) {
      setError("❌ Las contraseñas no coinciden");
      return;
    }

    if (formData.clave.length < 6) {
      setError("❌ La contraseña debe tener al menos 6 caracteres");
      return;
    }

    // ✅ Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("❌ Por favor ingrese un email válido");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("📝 Registrando nuevo usuario...", {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim().toLowerCase(), // ✅ Lowercase para consistencia
      });

      const registerData = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim().toLowerCase(), // ✅ Lowercase para consistencia
        clave: formData.clave,
        rol: UserRol.USER, // ✅ Todos los nuevos usuarios son USER
      };

      await register(registerData);

      console.log("✅ Usuario registrado exitosamente");

      setSuccess(
        "✅ Usuario registrado exitosamente. Redirigiendo al login...",
      );

      // ✅ Redirigir a login después de 2 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("❌ Error al registrar usuario:", err);
      // El error ya viene del AuthContext (authError)
      // Pero podemos setear uno local también si es necesario
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">🎸 Registrarse</h1>
          <p className="auth-subtitle">Crea tu cuenta en Musical Hendrix</p>
        </div>

        {/* Mensajes de error */}
        {(error || authError) && (
          <div className="auth-error" role="alert">
            {error || authError}
          </div>
        )}

        {/* Mensaje de éxito */}
        {success && (
          <div className="auth-success" role="alert">
            {success}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                disabled={loading || !!success}
                placeholder="Ingresa tu nombre"
                maxLength={50}
                required
                autoComplete="given-name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="apellido">Apellido *</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                disabled={loading || !!success}
                placeholder="Ingresa tu apellido"
                maxLength={50}
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading || !!success}
              placeholder="ejemplo@email.com"
              required
              autoComplete="email"
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
              disabled={loading || !!success}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
              autoComplete="new-password"
            />
            <small className="form-hint">
              La contraseña debe tener al menos 6 caracteres
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmarClave">Confirmar Contraseña *</label>
            <input
              type="password"
              id="confirmarClave"
              name="confirmarClave"
              value={formData.confirmarClave}
              onChange={handleChange}
              disabled={loading || !!success}
              placeholder="Confirma tu contraseña"
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading || !!success}
          >
            {loading ? "⏳ Registrando..." : "✅ Registrarse"}
          </button>
        </form>

        <div className="auth-links">
          <p>
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="auth-link">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistroPage;
