// =============================================================================
// token.service.ts
// Capa de PERSISTENCIA de la sesión en el navegador (localStorage).
// Concepto aplicado: servicio @Injectable({ providedIn: 'root' }) = singleton
// compartido por toda la app, sin declararlo en ningún módulo. Este servicio NO
// habla con el backend: solo guarda/lee el JWT y los datos del usuario para que
// la sesión sobreviva a recargar la página (F5).
// Lo consumen AuthService (login/logout) y, normalmente, el interceptor HTTP que
// adjunta el token a cada petición (cabecera Authorization: Bearer ...).
// =============================================================================
import { Injectable } from '@angular/core';
import { UsuarioResponse } from '../models/usuario.model';

// Claves constantes: evitan errores de tipeo ("magic strings") y centralizan
// el nombre con el que se guarda cada dato en localStorage.
const CLAVE_TOKEN = 'accessToken';
const CLAVE_USUARIO = 'usuario';

/** Lee y escribe la sesión en localStorage. */
@Injectable({ providedIn: 'root' })
export class TokenService {
  /**
   * Guarda el JWT y el usuario tras un login exitoso.
   * localStorage solo almacena texto, por eso el objeto usuario se serializa
   * con JSON.stringify.
   * @param token JWT devuelto por POST /auth/login.
   * @param usuario datos del usuario autenticado.
   */
  guardarSesion(token: string, usuario: UsuarioResponse): void {
    localStorage.setItem(CLAVE_TOKEN, token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
  }

  /** Devuelve el JWT guardado, o null si no hay sesión. */
  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  /**
   * Reconstruye el usuario guardado (JSON.parse del texto).
   * Devuelve null si no hay nada o si el texto está corrupto: el try/catch evita
   * que un valor alterado a mano en localStorage rompa la aplicación al arrancar.
   */
  obtenerUsuario(): UsuarioResponse | null {
    const texto = localStorage.getItem(CLAVE_USUARIO);
    if (!texto) {
      return null;
    }
    try {
      return JSON.parse(texto) as UsuarioResponse;
    } catch {
      // Texto no es JSON válido: se trata como "sin sesión".
      return null;
    }
  }

  /** Cierra la sesión local: borra token y usuario de localStorage. */
  limpiar(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
  }
}
