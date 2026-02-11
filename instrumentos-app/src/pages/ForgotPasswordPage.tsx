import { useState, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../service/authService";
import "./AuthPages.css";

const ForgotPasswordPage = () => {
  const { isAuthenticated } = useAuth();

  // ✅ Si ya está autenticado, redirigir
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // ✅ Validación de email
    if (!email.trim()) {
      setError("❌ Por favor ingresa tu email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("❌ Por favor ingresa un email válido");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      console.log("📧 Enviando solicitud de recuperación...", email.trim());

      // ✅ Usar authService centralizado
      const response = await authService.forgotPassword(
        email.trim().toLowerCase(),
      );

      console.log("✅ Solicitud enviada exitosamente");

      setMessage(
        response.message ||
          "✅ Si el email existe, recibirás un enlace de recuperación en breve.",
      );
    } catch (err) {
      console.error("❌ Error al enviar solicitud:", err);
      setError(
        "❌ Error al enviar la solicitud. Por favor, intenta nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">🔑 Recuperar Contraseña</h1>
          <p className="auth-subtitle">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {message ? (
          <div className="success-container">
            <div className="auth-success" role="alert">
              <p>{message}</p>
            </div>
            <div className="auth-links">
              <Link to="/login" className="auth-link btn-back">
                ← Volver al login
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  placeholder="ejemplo@email.com"
                  required
                  autoComplete="email"
                  autoFocus
                />
                <small className="form-hint">
                  Ingresa el email con el que te registraste
                </small>
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading
                  ? "⏳ Enviando..."
                  : "📧 Enviar enlace de recuperación"}
              </button>
            </form>

            <div className="auth-links">
              <p>
                ¿Recordaste tu contraseña?{" "}
                <Link to="/login" className="auth-link">
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
