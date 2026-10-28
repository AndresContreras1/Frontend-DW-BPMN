// =============================================================================
// lane.service.ts
// Servicio CRUD de LANES BPMN (carriles de un pool que representan responsables
// o áreas). Conceptos: @Injectable root, HttpClient tipado, Observables y uso de
// PATCH para una modificación parcial (reordenar) frente a PUT (reemplazo completo).
// Listar/crear cuelgan del pool; editar/eliminar apuntan a la lane directa.
// Apoya las HU del editor de diagramas (modelado y orden de lanes).
// =============================================================================
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LaneRequest, LaneResponse, ReordenarLanesRequest } from '../models/lane.model';

/** Acceso HTTP a las lanes de un pool. */
@Injectable({ providedIn: 'root' })
export class LaneService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  /** Lista las lanes de un pool. GET /pools/{poolId}/lanes. */
  listar(poolId: number): Observable<LaneResponse[]> {
    return this.http.get<LaneResponse[]>(`${this.url}/pools/${poolId}/lanes`);
  }

  /** Crea una lane en un pool. POST /pools/{poolId}/lanes. */
  crear(poolId: number, datos: LaneRequest): Observable<LaneResponse> {
    return this.http.post<LaneResponse>(`${this.url}/pools/${poolId}/lanes`, datos);
  }

  /** Edita una lane. PUT /lanes/{id}. */
  editar(id: number, datos: LaneRequest): Observable<LaneResponse> {
    return this.http.put<LaneResponse>(`${this.url}/lanes/${id}`, datos);
  }

  /**
   * Cambia el orden de las lanes de un pool. PATCH /pools/{poolId}/lanes/orden.
   * Devuelve la lista completa ya reordenada para refrescar la vista.
   */
  reordenar(poolId: number, datos: ReordenarLanesRequest): Observable<LaneResponse[]> {
    return this.http.patch<LaneResponse[]>(`${this.url}/pools/${poolId}/lanes/orden`, datos);
  }

  /** Elimina una lane. DELETE /lanes/{id}. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/lanes/${id}`);
  }
}
