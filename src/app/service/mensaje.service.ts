import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CorrelacionRequest,
  CorrelacionResponse,
  EditarMensajeRequest,
  MensajeRequest,
  MensajeResponse
} from '../models/mensaje.model';

@Injectable({ providedIn: 'root' })
export class MensajeService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  listar(procesoId: number): Observable<MensajeResponse[]> {
    return this.http.get<MensajeResponse[]>(`${this.url}/procesos/${procesoId}/mensajes`);
  }

  crear(procesoId: number, datos: MensajeRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.url}/procesos/${procesoId}/mensajes`, datos);
  }

  editar(id: number, datos: EditarMensajeRequest): Observable<MensajeResponse> {
    return this.http.put<MensajeResponse>(`${this.url}/mensajes/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/mensajes/${id}`);
  }

  obtenerCorrelacion(mensajeId: number): Observable<CorrelacionResponse> {
    return this.http.get<CorrelacionResponse>(`${this.url}/mensajes/${mensajeId}/correlacion`);
  }

  definirCorrelacion(mensajeId: number, datos: CorrelacionRequest): Observable<CorrelacionResponse> {
    return this.http.put<CorrelacionResponse>(`${this.url}/mensajes/${mensajeId}/correlacion`, datos);
  }

  eliminarCorrelacion(mensajeId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/mensajes/${mensajeId}/correlacion`);
  }
}
