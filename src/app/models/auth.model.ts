// Modelos de autenticación: lo que se envía al iniciar sesión y la respuesta con el token JWT.
import { UsuarioResponse } from './usuario.model';

// Credenciales enviadas a POST /auth/login.
export interface LoginRequest {
  email: string;
  password: string;
}

// Respuesta del login: el token se guarda en TokenService y el interceptor lo adjunta a cada petición.
export interface LoginResponse {
  accessToken: string;
  // Normalmente "Bearer"; es el prefijo del encabezado Authorization.
  tokenType: string;
  // Duración del token en la unidad que defina el backend.
  expiresIn: number;
  // Datos del usuario autenticado (incluye su rol) para evitar otra petición tras el login.
  usuario: UsuarioResponse;
}
