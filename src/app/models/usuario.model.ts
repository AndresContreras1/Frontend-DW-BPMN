import { RolAcceso } from './enums.model';

export interface UsuarioResponse {
  id: number;
  nombre: string;
  email: string;
  rolAcceso: RolAcceso;
  activo: boolean;
}

export interface CrearUsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rolAcceso: RolAcceso;
}

export interface ActualizarUsuarioRequest {
  rolAcceso?: RolAcceso;
  activo?: boolean;
}

export interface InvitacionUsuarioRequest {
  email?: string;
  rolAcceso: RolAcceso;
}

export interface InvitacionUsuarioResponse {
  id: number;
  email: string;
  rolAcceso: RolAcceso;
  token: string;
  fechaExpiracion: string;
}

export interface AceptarInvitacionRequest {
  nombre: string;
  password: string;
}
