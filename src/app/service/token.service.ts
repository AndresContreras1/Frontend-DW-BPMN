import { Injectable } from '@angular/core';
import { UsuarioResponse } from '../models/usuario.model';

const CLAVE_TOKEN = 'accessToken';
const CLAVE_USUARIO = 'usuario';

/** Lee y escribe la sesión en localStorage. */
@Injectable({ providedIn: 'root' })
export class TokenService {
  guardarSesion(token: string, usuario: UsuarioResponse): void {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
  }

  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  obtenerUsuario(): UsuarioResponse | null {
    const texto = localStorage.getItem(CLAVE_USUARIO);
    if (!texto) {
      return null;
    }
    try {
      return JSON.parse(texto) as UsuarioResponse;
    } catch {
      return null;
    }
  }

  limpiar(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
  }
}
