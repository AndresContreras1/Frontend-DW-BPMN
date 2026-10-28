import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ActividadRequest, ActividadResponse } from '../models/actividad.model';
import { ImpactoEliminacionResponse } from '../models/impacto-eliminacion.model';

@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  listar(laneId: number): Observable<ActividadResponse[]> {
    return this.http.get<ActividadResponse[]>(`${this.url}/lanes/${laneId}/actividades`);
  }

  crear(laneId: number, datos: ActividadRequest): Observable<ActividadResponse> {
    return this.http.post<ActividadResponse>(`${this.url}/lanes/${laneId}/actividades`, datos);
  }

  editar(id: number, datos: ActividadRequest): Observable<ActividadResponse> {
    return this.http.put<ActividadResponse>(`${this.url}/actividades/${id}`, datos);
  }

  impactoEliminacion(id: number): Observable<ImpactoEliminacionResponse> {
    return this.http.get<ImpactoEliminacionResponse>(`${this.url}/actividades/${id}/impacto-eliminacion`);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/actividades/${id}`);
  }
}
