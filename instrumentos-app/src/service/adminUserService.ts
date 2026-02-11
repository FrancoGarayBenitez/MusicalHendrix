import { AdminUserUpdateRequest, UserRol, Usuario } from "../types/auth";
import { authService } from "./authService";

const API_URL = "http://localhost:8080/api/usuarios";

/**
 * Servicio para administración de usuarios (solo ADMIN)
 */
export const adminUserService = {
  /**
   * Obtener todos los usuarios (solo ADMIN)
   */
  async getAllUsers(): Promise<Usuario[]> {
    try {
      const currentUser = authService.getUserFromStorage();

      if (!currentUser || currentUser.rol !== UserRol.ADMIN) {
        throw new Error("No tienes permisos para realizar esta acción");
      }

      const response = await fetch(`${API_URL}`, {
        method: "GET",
        headers: authService.getAuthHeaders(), // ✅ JWT Bearer Token
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener usuarios");
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      throw error;
    }
  },

  /**
   * Obtener un usuario por ID (solo ADMIN)
   */
  async getUserById(userId: number): Promise<Usuario> {
    try {
      const currentUser = authService.getUserFromStorage();

      if (!currentUser || currentUser.rol !== UserRol.ADMIN) {
        throw new Error("No tienes permisos para realizar esta acción");
      }

      const response = await fetch(`${API_URL}/${userId}`, {
        method: "GET",
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Usuario no encontrado");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener usuario");
      }

      return await response.json();
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      throw error;
    }
  },

  /**
   * Actualizar rol y estado de un usuario (solo ADMIN)
   */
  async updateUser(
    userId: number,
    updateData: AdminUserUpdateRequest,
  ): Promise<Usuario> {
    try {
      const currentUser = authService.getUserFromStorage();

      if (!currentUser || currentUser.rol !== UserRol.ADMIN) {
        throw new Error("Solo los administradores pueden modificar usuarios");
      }

      if (userId === currentUser.id) {
        throw new Error("No puedes modificar tu propia cuenta");
      }

      const response = await fetch(`${API_URL}/${userId}`, {
        method: "PUT",
        headers: authService.getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar usuario");
      }

      return data;
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      throw error;
    }
  },

  /**
   * Deshabilitar usuario - baja lógica (solo ADMIN)
   */
  async disableUser(userId: number): Promise<boolean> {
    try {
      const currentUser = authService.getUserFromStorage();

      if (!currentUser || currentUser.rol !== UserRol.ADMIN) {
        throw new Error(
          "Solo los administradores pueden deshabilitar usuarios",
        );
      }

      if (userId === currentUser.id) {
        throw new Error("No puedes deshabilitar tu propia cuenta");
      }

      const response = await fetch(`${API_URL}/${userId}`, {
        method: "DELETE",
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok && response.status !== 204) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Error al deshabilitar usuario");
      }

      return true;
    } catch (error) {
      console.error("Error al deshabilitar usuario:", error);
      throw error;
    }
  },
};
