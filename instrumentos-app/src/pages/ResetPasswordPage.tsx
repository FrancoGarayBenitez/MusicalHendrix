import { useState, useEffect, FormEvent } from "react";
import { useSearchParams, useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../service/authService";
import "./AuthPages.css";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const token = searchParams.get("token");

  // ✅ Si ya está autenticado, redirigir
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Verificar token al cargar
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("❌ Token inválido o no proporcionado");
        setVerifying(false);
        return;
      }

      try {
        console.log("🔍 Verificando token...");

        // ✅ Usar authService centralizado
        const data = await authService.verifyResetToken(token);

        if (data.valid) {
          console.log("✅ Token válido");
          setTokenValid(true);
        } else {
          console.warn("⚠️ Token inválido o expirado");
          setError("❌ El enlace ha expirado o es inválido");
        }
      } catch (err) {
        console.error("❌ Error al verificar token:", err);
        setError("❌ Error al verificar el enlace");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // ✅ Validaciones
    if (!password || !confirmPassword) {
      setError("❌ Por favor completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      setError("❌ Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      setError("❌ La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("🔐 Restableciendo contraseña...");

      // ✅ Usar authService centralizado
      await authService.resetPassword(token!, password);

      console.log("✅ Contraseña actualizada exitosamente");

      setMessage(
        "✅ Contraseña actualizada exitosamente. Redirigiendo al login...",
      );

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("❌ Error al actualizar contraseña:", err);
      setError(
        "❌ Error al actualizar la contraseña. Por favor, intenta nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Loading mientras verifica el token
  if (verifying) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1 className="auth-title">Verificando enlace...</h1>
          </div>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Por favor espera...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Token inválido
  if (!tokenValid) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <h1 className="auth-title">🔗 Enlace Inválido</h1>
          </div>
          <div className="auth-error" role="alert">
            {error || "❌ El enlace ha expirado o es inválido"}
          </div>
          <div className="auth-links">
            <Link to="/forgot-password" className="auth-link btn-back">
              🔄 Solicitar nuevo enlace
            </Link>
            <Link to="/login" className="auth-link btn-back">
              ← Volver al login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Formulario de nueva contraseña
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">🔐 Nueva Contraseña</h1>
          <p className="auth-subtitle">Elige una contraseña segura</p>
        </div>

        {message ? (
          <div className="success-container">
            <div className="auth-success" role="alert">
              <p>{message}</p>
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
                <label htmlFor="password">Nueva Contraseña *</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                  autoComplete="new-password"
                  autoFocus
                />
                <small className="form-hint">
                  La contraseña debe tener al menos 6 caracteres
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  placeholder="Confirma tu nueva contraseña"
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? "⏳ Actualizando..." : "✅ Actualizar contraseña"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
