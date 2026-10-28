// Modelos de usuario e invitaciones. Un administrador puede crear usuarios directamente o
// invitarlos con un enlace que contiene un token.
import { RolAcceso } from './enums.model';

// Usuario sin contraseña: el backend nunca la devuelve.
export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  rolAcceso: RolAcceso;
  activo: boolean;
}

// Alta directa por un administrador (la contraseña mínima de 8 caracteres la valida el backend).
export interface CrearUsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rolAcceso: RolAcceso;
}

// Solo se pueden cambiar rol y estado activo; ambos opcionales.
export interface ActualizarUsuarioRequest {
  rolAcceso?: RolAcceso;
  activo?: boolean;
}

// El email es opcional: la invitación puede ser un enlace genérico.
export interface InvitacionUsuarioRequest {
  email?: string;
  rolAcceso: RolAcceso;
}

// El token se arma en el enlace /invitacion/:token que recibe el invitado.
export interface InvitacionUsuarioResponse {
  id: number;
  email: string;
  rolAcceso: RolAcceso;
  token: string;
  fechaExpiracion: string;
}

// El invitado completa su nombre y contraseña para crear la cuenta.
export interface AceptarInvitacionRequest {
  nombre: string;
  password: string;
}
