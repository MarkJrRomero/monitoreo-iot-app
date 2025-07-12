export interface Usuario {
  id: number;
  email?: string;
  correo: string;
  nombre: string;
  rol: string;
  createdAt: string;
}

export interface LoginCredentials {
  email?: string;
  correo: string;
  password: string;
}

export interface LoginResponse {
  usuario: Usuario;
  token: string;
  message?: string;
}

export interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  isAuthenticated: boolean;
}
  