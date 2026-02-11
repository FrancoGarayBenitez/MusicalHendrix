import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  LoginRequest,
  LoginResponse,
  RegistroRequest,
  AuthState,
  UserRol,
} from "../types/auth";
import { authService } from "../service/authService";

interface AuthContextProps {
  user: LoginResponse | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  register: (userData: RegistroRequest) => Promise<any>;
  logout: () => void;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Componente proveedor de autenticación
 * Gestiona el estado global de autenticación usando JWT
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  /**
   * Verifica si el usuario ya está autenticado al cargar la aplicación
   * Lee el token JWT del localStorage
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = authService.getUserFromStorage();

        if (user && user.token && user.activo) {
          // ✅ Validar token con el backend
          const currentUser = await authService.getCurrentUser();

          if (currentUser && currentUser.activo) {
            // Token válido - mantener sesión
            setState({
              user,
              loading: false,
              error: null,
              isAuthenticated: true,
            });
            console.log("✅ Usuario autenticado:", currentUser.email);
          } else {
            // Token inválido o usuario deshabilitado
            console.warn("⚠️ Token inválido o usuario deshabilitado");
            authService.logout();
            setState({
              user: null,
              loading: false,
              error: null,
              isAuthenticated: false,
            });
          }
        } else {
          // No hay usuario o no tiene token
          if (user && !user.activo) {
            console.warn("⚠️ Usuario inactivo en localStorage");
            authService.logout();
          }

          setState({
            user: null,
            loading: false,
            error: null,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error("❌ Error al verificar autenticación:", error);
        authService.logout();
        setState({
          user: null,
          loading: false,
          error: null,
          isAuthenticated: false,
        });
      }
    };

    checkAuth();
  }, []);

  /**
   * Función para iniciar sesión
   * Envía credenciales al backend y obtiene JWT
   */
  const login = useCallback(
    async (credentials: LoginRequest): Promise<LoginResponse> => {
      try {
        console.log("🔐 Iniciando sesión...", credentials.email);

        setState((prevState) => ({
          ...prevState,
          loading: true,
          error: null,
        }));

        const response = await authService.login(credentials);

        // ✅ Verificar que el login fue exitoso y el usuario está activo
        if (response.success && response.activo && response.token) {
          console.log("✅ Login exitoso:", {
            email: response.email,
            rol: response.rol,
            activo: response.activo,
          });

          // Token ya guardado en authService.login()
          setState({
            user: response,
            loading: false,
            error: null,
            isAuthenticated: true,
          });

          return response;
        } else {
          // Login fallido
          const errorMessage = !response.activo
            ? "El usuario está deshabilitado. Contacte al administrador."
            : !response.token
              ? "No se recibió token de autenticación"
              : response.message || "Error de autenticación";

          console.warn("⚠️ Login fallido:", errorMessage);

          setState({
            user: null,
            loading: false,
            error: errorMessage,
            isAuthenticated: false,
          });

          // Limpiar localStorage si hay datos corruptos
          authService.logout();

          throw new Error(errorMessage);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Error desconocido al iniciar sesión";

        console.error("❌ Error en login:", errorMessage);

        setState({
          user: null,
          loading: false,
          error: errorMessage,
          isAuthenticated: false,
        });

        throw error;
      }
    },
    [],
  );

  /**
   * Registro de usuario
   * Crea una nueva cuenta de usuario
   */
  const register = useCallback(
    async (userData: RegistroRequest): Promise<any> => {
      try {
        console.log("📝 Registrando usuario:", userData.email);

        setState((prevState) => ({
          ...prevState,
          loading: true,
          error: null,
        }));

        const response = await authService.register(userData);

        console.log("✅ Usuario registrado exitosamente:", response);

        setState((prevState) => ({
          ...prevState,
          loading: false,
        }));

        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Error desconocido al registrar";

        console.error("❌ Error en registro:", errorMessage);

        setState((prevState) => ({
          ...prevState,
          loading: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    [],
  );

  /**
   * Cerrar sesión
   * Limpia el token JWT y el estado del usuario
   */
  const logout = useCallback(() => {
    console.log("👋 Cerrando sesión...");

    authService.logout();

    setState({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
    });

    console.log("✅ Sesión cerrada");
  }, []);

  /**
   * Limpiar mensaje de error
   */
  const clearError = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      error: null,
    }));
  }, []);

  /**
   * ✅ NUEVO - Refrescar datos del usuario desde el backend
   * Útil después de que un admin modifique el usuario
   */
  const refreshUser = useCallback(async () => {
    try {
      console.log("🔄 Refrescando datos del usuario...");

      const currentUser = await authService.getCurrentUser();

      if (currentUser && currentUser.activo) {
        // Actualizar solo los datos del usuario, mantener el token
        const user = authService.getUserFromStorage();

        if (user) {
          const updatedUser: LoginResponse = {
            ...user,
            // Actualizar con datos frescos del backend
            // (el backend no devuelve token en /me)
            email: currentUser.email,
            rol: currentUser.rol,
            activo: currentUser.activo,
          };

          authService.saveUserToStorage(updatedUser);

          setState((prevState) => ({
            ...prevState,
            user: updatedUser,
          }));

          console.log("✅ Usuario refrescado:", currentUser.email);
        }
      } else {
        // Usuario deshabilitado o no encontrado
        console.warn("⚠️ Usuario no encontrado o deshabilitado");
        logout();
      }
    } catch (error) {
      console.error("❌ Error al refrescar usuario:", error);
      // No cerrar sesión automáticamente en caso de error de red
    }
  }, [logout]);

  const contextValues: AuthContextProps = {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.user?.rol === UserRol.ADMIN,
    login,
    register,
    logout,
    clearError,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValues}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para acceder al contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};

export default AuthContext;
