//solicitud de login (adaptado a tu backend)
export interface LoginRequest {
  email: string;
  clave: string;
}

//respuesta de login (adaptada al backend)
export interface LoginResponse {
  id: number;
  email: string;
  rol:
    | string
    | {
        idRol: number;
        definicion: string;
      };
  token?: string;
  success: boolean;
  message: string;
}

//solicitud de registro (adaptada a tu backend)
export interface RegistroRequest {
  nombre: string;
  apellido: string;
  email: string;
  clave: string;
  rol?: string;
}

//estado del contexto de autenticación
export interface AuthState {
  user: LoginResponse | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

//roles disponibles (compatibles tu backend)
export enum UserRol {
  ADMIN = "Admin",
  OPERADOR = "Operador",
  VISOR = "Visor",
}
