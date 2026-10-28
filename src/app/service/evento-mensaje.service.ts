import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EventoMensajeRequest, EventoMensajeResponse } from '../models/evento-mensaje.model';

@Injectable({ providedIn: 'root' })
export class EventoMensajeService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  listar(laneId: number): Observable<EventoMensajeResponse[]> {
    return this.http.get<EventoMensajeResponse[]>(`${this.url}/lanes/${laneId}/eventos-mensaje`);
  }

  crear(laneId: number, datos: EventoMensajeRequest): Observable<EventoMensajeResponse> {
    return this.http.post<EventoMensajeResponse>(`${this.url}/lanes/${laneId}/eventos-mensaje`, datos);
  }

  editar(id: number, datos: EventoMensajeRequest): Observable<EventoMensajeResponse> {
    return this.http.put<EventoMensajeResponse>(`${this.url}/eventos-mensaje/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/eventos-mensaje/${id}`);
  }
}
