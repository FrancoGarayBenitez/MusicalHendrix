import { LoginRequest, LoginResponse, RegistroRequest } from "../types/auth";

const API_URL = "http://localhost:8080/api";

//servicio de autenticacion (adaptado a tu backend)
export const authService = {
  //inicio de sesion
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

      //backend devuelve: { id, nombreUsuario, rol, success, message }
      return {
        id: data.id,
        email: data.email,
        rol: data.rol,
        success: data.success,
        message: data.message,
      };
    } catch (error) {
      console.error("Error en login:", error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Error desconocido en el login");
      }
    }
  },

  //registro de usuario
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
          rol: userData.rol || "Visor",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en el registro");
      }

      return data;
    } catch (error) {
      console.error("Error en registro:", error);
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Error desconocido en el registro");
      }
    }
  },

  //obtengo el header de autenticación para tu backend
  setAuthHeader(userId: string | number | null): Record<string, string> {
    if (userId) {
      return {
        "X-User-Id": userId.toString(), //backend usa header X-User-Id
      };
    }
    return {};
  },

  //info del usuario de localStorage
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

  //guardo la info del usuario en localStorage
  saveUserToStorage(user: LoginResponse) {
    localStorage.setItem("user", JSON.stringify(user));
  },

  //elimino la info del usuario de localStorage
  removeUserFromStorage() {
    localStorage.removeItem("user");
  },
};
