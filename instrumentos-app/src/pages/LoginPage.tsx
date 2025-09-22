import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPages.css";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    clave: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    //limpia los errores al cambiar el campo
    if (error) setError(null);
    if (authError) clearError();
  };

  //envio del formulario
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.clave) {
      setError("Por favor complete todos los campos");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      //login
      const response = await login(formData);

      if (response.success) {
        //ir a pagina de inicio
        navigate("/");
      } else {
        setError(response.message || "Error de autenticación");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Iniciar Sesión</h1>

        {(error || authError) && (
          <div className="auth-error">{error || authError}</div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              placeholder="Ingrese su email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="clave">Contraseña</label>
            <input
              type="password"
              id="clave"
              name="clave"
              value={formData.clave}
              onChange={handleChange}
              disabled={loading}
              placeholder="Ingrese su contraseña"
            />
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
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
