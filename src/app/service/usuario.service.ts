// =============================================================================
// usuario.service.ts
// Servicio de USUARIOS de la empresa: CRUD, desactivación (borrado lógico) e
// INVITACIONES por token. Conceptos: @Injectable root, HttpClient tipado,
// Observables, HttpParams opcional y PATCH para actualización parcial.
// Apoya las HU de administración de usuarios (crear, editar, desactivar,
// listar activos/desactivados) y de invitar a un usuario y que acepte su invitación.
// =============================================================================
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AceptarInvitacionRequest,
  ActualizarUsuarioRequest,
  CrearUsuarioRequest,
  InvitacionUsuarioRequest,
  InvitacionUsuarioResponse,
  UsuarioResponse
} from '../models/usuario.model';

/** Acceso HTTP al recurso /usuarios del backend. */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios`;

  /**
   * Por defecto el backend lista los activos; con activo=false lista los desactivados.
   * GET /usuarios[?activo=true|false]. Si no se pasa el argumento, se envía un
   * HttpParams vacío y manda el comportamiento por defecto del backend.
   */
  listar(activo?: boolean): Observable<UsuarioResponse[]> {
    const params = activo === undefined ? new HttpParams() : new HttpParams().set('activo', activo);
    return this.http.get<UsuarioResponse[]>(this.url, { params });
  }

  /** Obtiene un usuario por id. GET /usuarios/{id}. */
  obtener(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.url}/${id}`);
  }

  /** Crea un usuario directamente. POST /usuarios. */
  crear(datos: CrearUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(this.url, datos);
  }

  /** Actualiza campos del usuario (parcial). PATCH /usuarios/{id}. */
  actualizar(id: number, datos: ActualizarUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.patch<UsuarioResponse>(`${this.url}/${id}`, datos);
  }

  /** Desactiva al usuario (borrado lógico: no se pierde su historial). DELETE /usuarios/{id}. */
  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** Envía una invitación a un correo para que se una a la empresa. POST /usuarios/invitaciones. */
  invitar(datos: InvitacionUsuarioRequest): Observable<InvitacionUsuarioResponse> {
    return this.http.post<InvitacionUsuarioResponse>(`${this.url}/invitaciones`, datos);
  }

  /**
   * El invitado acepta la invitación con el token recibido (va en la ruta) y define
   * sus datos/contraseña. POST /usuarios/invitaciones/{token}/aceptar.
   */
  aceptarInvitacion(token: string, datos: AceptarInvitacionRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.url}/invitaciones/${token}/aceptar`, datos);
  }
}
