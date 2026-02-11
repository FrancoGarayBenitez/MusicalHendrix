/**
 * Roles de usuario disponibles en la aplicación.
 * Deben coincidir con el backend.
 */
export enum UserRol {
  ADMIN = "ADMIN",
  USER = "USER",
}

/**
 * Define la estructura de un usuario en el sistema.
 * Utilizado en la lista de gestión de usuarios.
 */
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRol;
  activo: boolean;
}

/**
 * Solicitud para el endpoint de login.
 */
export interface LoginRequest {
  email: string;
  clave: string;
}

/**
 * Respuesta esperada del endpoint de login.
 * También es la estructura que se guarda en el estado de autenticación.
 */
export interface LoginResponse {
  id: number;
  email: string;
  rol: UserRol;
  token: string;
  success: boolean;
  message: string;
  activo: boolean;
}

/**
 * Solicitud para el endpoint de registro de un nuevo usuario.
 */
export interface RegistroRequest {
  nombre: string;
  apellido: string;
  email: string;
  clave: string;
  rol?: UserRol;
}

/**
 * Estado global de autenticación manejado por AuthContext.
 */
export interface AuthState {
  user: LoginResponse | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

/**
 * Solicitud para actualizar un usuario desde el panel de administrador.
 */
export interface AdminUserUpdateRequest {
  rol: UserRol;
  activo: boolean;
  clave?: string;
}

/**
 * Función auxiliar para obtener el string del rol
 */
export function getRolString(rol: UserRol | string | undefined): string {
  if (!rol) return "";
  return rol.toString();
}
