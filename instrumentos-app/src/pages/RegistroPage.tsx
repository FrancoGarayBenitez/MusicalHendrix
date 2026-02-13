import { useState, FormEvent } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserRol } from "../types/auth";

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
    rol: UserRol.USER,
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
        email: formData.email.trim().toLowerCase(),
      });

      const registerData = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim().toLowerCase(),
        clave: formData.clave,
        rol: UserRol.USER,
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8">
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
            Crear Cuenta
          </h2>
          <p className="text-slate-600">Únete a nuestra comunidad musical</p>
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

          {/* Mensaje de éxito */}
          {success && (
            <div
              className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6 text-sm font-medium"
              role="alert"
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Nombre *
                </label>
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
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-musical-teal focus:ring-4 focus:ring-musical-teal/10 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="apellido"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Apellido *
                </label>
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
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-musical-teal focus:ring-4 focus:ring-musical-teal/10 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

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
                disabled={loading || !!success}
                placeholder="ejemplo@email.com"
                required
                autoComplete="email"
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
                disabled={loading || !!success}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-musical-teal focus:ring-4 focus:ring-musical-teal/10 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <small className="text-xs text-slate-500 mt-1">
                La contraseña debe tener al menos 6 caracteres
              </small>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmarClave"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Confirmar Contraseña *
              </label>
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
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-musical-teal focus:ring-4 focus:ring-musical-teal/10 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !!success}
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
                  Registrando...
                </span>
              ) : (
                "✅ Registrarse"
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              ¿Ya tienes una cuenta?{" "}
              <Link
                to="/login"
                className="text-musical-teal font-semibold hover:text-musical-slate transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroPage;
