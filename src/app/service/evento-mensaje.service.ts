// =============================================================================
// evento-mensaje.service.ts
// Servicio CRUD de EVENTOS DE MENSAJE BPMN (eventos que envían o reciben un
// mensaje, ubicados en una lane). Conceptos: @Injectable root, HttpClient
// tipado, Observables. Listar/crear cuelgan de la lane; editar/eliminar apuntan
// al evento directo (patrón REST anidado/plano).
// Apoya las HU del editor de diagramas (eventos de mensaje y colaboración entre pools).
// =============================================================================
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EventoMensajeRequest, EventoMensajeResponse } from '../models/evento-mensaje.model';

/** Acceso HTTP a los eventos de mensaje de una lane. */
@Injectable({ providedIn: 'root' })
export class EventoMensajeService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  /** Lista los eventos de mensaje de una lane. GET /lanes/{laneId}/eventos-mensaje. */
  listar(laneId: number): Observable<EventoMensajeResponse[]> {
    return this.http.get<EventoMensajeResponse[]>(`${this.url}/lanes/${laneId}/eventos-mensaje`);
  }

  /** Crea un evento de mensaje en una lane. POST /lanes/{laneId}/eventos-mensaje. */
  crear(laneId: number, datos: EventoMensajeRequest): Observable<EventoMensajeResponse> {
    return this.http.post<EventoMensajeResponse>(`${this.url}/lanes/${laneId}/eventos-mensaje`, datos);
  }

  /** Edita un evento de mensaje (también para moverlo de lane). PUT /eventos-mensaje/{id}. */
  editar(id: number, datos: EventoMensajeRequest): Observable<EventoMensajeResponse> {
    return this.http.put<EventoMensajeResponse>(`${this.url}/eventos-mensaje/${id}`, datos);
  }

  /** Elimina un evento de mensaje. DELETE /eventos-mensaje/{id}. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/eventos-mensaje/${id}`);
  }
}
