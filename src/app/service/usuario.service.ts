import { HttpClient } from '@angular/common/http';
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

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios`;

  listar(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.url);
  }

  obtener(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.url}/${id}`);
  }

  crear(datos: CrearUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(this.url, datos);
  }

  actualizar(id: number, datos: ActualizarUsuarioRequest): Observable<UsuarioResponse> {
    return this.http.patch<UsuarioResponse>(`${this.url}/${id}`, datos);
  }

  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  invitar(datos: InvitacionUsuarioRequest): Observable<InvitacionUsuarioResponse> {
    return this.http.post<InvitacionUsuarioResponse>(`${this.url}/invitaciones`, datos);
  }

  aceptarInvitacion(token: string, datos: AceptarInvitacionRequest): Observable<UsuarioResponse> {
    return this.http.post<UsuarioResponse>(`${this.url}/invitaciones/${token}/aceptar`, datos);
  }
}
