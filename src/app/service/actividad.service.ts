// =============================================================================
// actividad.service.ts
// Servicio CRUD de ACTIVIDADES BPMN (tareas dentro de una lane). Conceptos:
// @Injectable root, HttpClient tipado, Observables. Incluye un endpoint de
// "impacto de eliminación": antes de borrar, se consulta qué otros elementos
// (arcos, etc.) se perderían, para pedir confirmación informada al usuario.
// Listar/crear cuelgan de la lane; editar/eliminar apuntan a la actividad directa.
// Apoya las HU del editor de diagramas (modelado de actividades).
// =============================================================================
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ActividadRequest, ActividadResponse } from '../models/actividad.model';
import { ImpactoEliminacionResponse } from '../models/impacto-eliminacion.model';

/** Acceso HTTP a las actividades de una lane. */
@Injectable({ providedIn: 'root' })
export class ActividadService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  /** Lista las actividades de una lane. GET /lanes/{laneId}/actividades. */
  listar(laneId: number): Observable<ActividadResponse[]> {
    return this.http.get<ActividadResponse[]>(`${this.url}/lanes/${laneId}/actividades`);
  }

  /** Crea una actividad en una lane. POST /lanes/{laneId}/actividades. */
  crear(laneId: number, datos: ActividadRequest): Observable<ActividadResponse> {
    return this.http.post<ActividadResponse>(`${this.url}/lanes/${laneId}/actividades`, datos);
  }

  /** Edita una actividad (también sirve para moverla de lane si el Request lo incluye). PUT /actividades/{id}. */
  editar(id: number, datos: ActividadRequest): Observable<ActividadResponse> {
    return this.http.put<ActividadResponse>(`${this.url}/actividades/${id}`, datos);
  }

  /** Consulta qué se afectaría al borrar la actividad (no borra nada). GET /actividades/{id}/impacto-eliminacion. */
  impactoEliminacion(id: number): Observable<ImpactoEliminacionResponse> {
    return this.http.get<ImpactoEliminacionResponse>(`${this.url}/actividades/${id}/impacto-eliminacion`);
  }

  /** Elimina una actividad. DELETE /actividades/{id}. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/actividades/${id}`);
  }
}
