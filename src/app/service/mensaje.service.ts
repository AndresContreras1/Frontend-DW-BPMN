// =============================================================================
// mensaje.service.ts
// Servicio CRUD de MENSAJES BPMN (los mensajes que viajan entre pools en una
// colaboración) y de su CORRELACIÓN (dato que identifica a qué instancia del
// proceso pertenece el mensaje). Conceptos: @Injectable root, HttpClient tipado,
// Observables. La correlación es un sub-recurso del mensaje (/mensajes/{id}/correlacion)
// y usa PUT para definirla (crear o reemplazar, idempotente).
// Apoya las HU del editor de diagramas (mensajes entre pools y correlación).
// =============================================================================
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

/** Acceso HTTP a los mensajes de un proceso y a su correlación. */
@Injectable({ providedIn: 'root' })
export class MensajeService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  /** Lista los mensajes de un proceso. GET /procesos/{procesoId}/mensajes. */
  listar(procesoId: number): Observable<MensajeResponse[]> {
    return this.http.get<MensajeResponse[]>(`${this.url}/procesos/${procesoId}/mensajes`);
  }

  /** Crea un mensaje en un proceso. POST /procesos/{procesoId}/mensajes. */
  crear(procesoId: number, datos: MensajeRequest): Observable<MensajeResponse> {
    return this.http.post<MensajeResponse>(`${this.url}/procesos/${procesoId}/mensajes`, datos);
  }

  /** Edita un mensaje (Request propio de edición). PUT /mensajes/{id}. */
  editar(id: number, datos: EditarMensajeRequest): Observable<MensajeResponse> {
    return this.http.put<MensajeResponse>(`${this.url}/mensajes/${id}`, datos);
  }

  /** Elimina un mensaje. DELETE /mensajes/{id}. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/mensajes/${id}`);
  }

  /** Consulta la correlación de un mensaje. GET /mensajes/{mensajeId}/correlacion. */
  obtenerCorrelacion(mensajeId: number): Observable<CorrelacionResponse> {
    return this.http.get<CorrelacionResponse>(`${this.url}/mensajes/${mensajeId}/correlacion`);
  }

  /** Define (crea o reemplaza) la correlación de un mensaje. PUT /mensajes/{mensajeId}/correlacion. */
  definirCorrelacion(mensajeId: number, datos: CorrelacionRequest): Observable<CorrelacionResponse> {
    return this.http.put<CorrelacionResponse>(`${this.url}/mensajes/${mensajeId}/correlacion`, datos);
  }

  /** Quita la correlación de un mensaje. DELETE /mensajes/{mensajeId}/correlacion. */
  eliminarCorrelacion(mensajeId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/mensajes/${mensajeId}/correlacion`);
  }
}
