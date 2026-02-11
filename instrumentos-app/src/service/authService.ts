import {
  LoginRequest,
  LoginResponse,
  RegistroRequest,
  Usuario,
} from "../types/auth";

const API_URL = "http://localhost:8080/api";

/**
 * Servicio de autenticación con JWT
 */
export const authService = {
  /**
   * Inicio de sesión
   * Ahora retorna un JWT token en lugar de X-User-Id
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_URL}/usuarios/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error de autenticación");
      }

      // Validar que el backend devolvió un token
      if (!data.token) {
        throw new Error("Token no recibido del servidor");
      }

      // Backend devuelve: { id, email, rol, token, success, message, activo }
      const loginResponse: LoginResponse = {
        id: data.id,
        email: data.email,
        rol: data.rol,
        token: data.token, // ✅ JWT Token
        success: data.success,
        message: data.message,
        activo: data.activo === true,
      };

      // Guardar automáticamente en localStorage
      this.saveUserToStorage(loginResponse);

      return loginResponse;
    } catch (error) {
      console.error("Error en login:", error);
      throw error instanceof Error
        ? error
        : new Error("Error desconocido en el login");
    }
  },

  /**
   * Registro de usuario
   */
  async register(userData: RegistroRequest): Promise<any> {
    try {
      const response = await fetch(`${API_URL}/usuarios/registro`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: userData.nombre,
          apellido: userData.apellido,
          email: userData.email,
          clave: userData.clave,
          rol: userData.rol || "USER",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en el registro");
      }

      return data;
    } catch (error) {
      console.error("Error en registro:", error);
      throw error instanceof Error
        ? error
        : new Error("Error desconocido en el registro");
    }
  },

  /**
   * Verificar si un email ya está registrado
   */
  async verificarEmail(email: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_URL}/usuarios/verificar-email?email=${encodeURIComponent(email)}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.existe || false;
    } catch (error) {
      console.error("Error verificando email:", error);
      return false;
    }
  },

  /**
   * Obtener información del usuario actual autenticado
   */
  async getCurrentUser(): Promise<Usuario | null> {
    try {
      const user = this.getUserFromStorage();
      if (!user || !user.token) {
        return null;
      }

      const response = await fetch(`${API_URL}/usuarios/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`, // ✅ JWT en header Authorization
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token inválido o expirado
          this.logout();
          return null;
        }
        throw new Error("Error al obtener usuario actual");
      }

      return await response.json();
    } catch (error) {
      console.error("Error obteniendo usuario actual:", error);
      return null;
    }
  },

  /**
   * ✅ NUEVO: Obtener headers de autenticación con JWT
   */
  getAuthHeaders(): HeadersInit {
    let token = localStorage.getItem("token");
    if (!token) {
      const user = this.getUserFromStorage();
      token = user?.token || null;
      if (token) {
        // rehacer la clave para futuras llamadas
        localStorage.setItem("token", token);
      } else {
        console.warn("No JWT token found");
        return { "Content-Type": "application/json" };
      }
    }
    try {
      const [, payloadB64] = token.split(".");
      const payloadJson = JSON.parse(
        atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")),
      );
      console.log("JWT payload:", {
        sub: payloadJson.sub,
        roles: payloadJson.roles || payloadJson.authorities,
        exp: payloadJson.exp,
      });
    } catch {
      console.warn("Failed to decode JWT payload");
    }
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  },

  /**
   * Obtener info del usuario de localStorage
   */
  getUserFromStorage(): LoginResponse | null {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        console.error("Error al parsear usuario de localStorage:", e);
        return null;
      }
    }
    return null;
  },

  /**
   * Guardar info del usuario en localStorage
   */
  saveUserToStorage(user: LoginResponse): void {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", user.token); // ✅ guarda el token separado
  },

  /**
   * Eliminar info del usuario de localStorage
   */
  removeUserFromStorage(): void {
    localStorage.removeItem("user");
    localStorage.removeItem("token"); // ✅ elimina el token también
  },

  /**
   * Verificar si hay un usuario autenticado
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const [, payloadB64] = token.split(".");
      const payloadJson = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
      return Date.now() / 1000 < payloadJson.exp;
    } catch {
      return false;
    }
  },

  /**
   * Verificar si el usuario actual es ADMIN
   */
  isAdmin(): boolean {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const [, payloadB64] = token.split(".");
      const payloadJson = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
      const roles: string[] = payloadJson.roles || payloadJson.authorities || [];
      return roles.includes("ADMIN") || roles.includes("ROLE_ADMIN");
    } catch {
      return false;
    }
  },

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.removeUserFromStorage();
  },

  /**
   * Solicitar recuperación de contraseña
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      console.log("📧 Enviando solicitud de recuperación:", email);

      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar solicitud");
      }

      return data;
    } catch (error) {
      console.error("❌ Error en forgotPassword:", error);
      throw error;
    }
  },

  /**
   * Verificar validez del token de reseteo
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean }> {
    try {
      console.log("🔍 Verificando token de reseteo");

      const response = await fetch(
        `${API_URL}/auth/verify-reset-token/${token}`,
      );
      const data = await response.json();

      if (!response.ok) {
        return { valid: false };
      }

      return data;
    } catch (error) {
      console.error("❌ Error en verifyResetToken:", error);
      return { valid: false };
    }
  },

  /**
   * Restablecer contraseña con token
   */
  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    try {
      console.log("🔐 Restableciendo contraseña");

      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al restablecer contraseña");
      }

      return data;
    } catch (error) {
      console.error("❌ Error en resetPassword:", error);
      throw error;
    }
  },
};
