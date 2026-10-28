// =============================================================================
// pool.service.ts
// Servicio CRUD de POOLS BPMN (el contenedor/participante principal de un
// proceso; dentro de un pool viven las lanes). Conceptos: @Injectable root,
// HttpClient tipado, Observables. Crear y listar cuelgan de un proceso
// (/procesos/{id}/pools); editar y eliminar apuntan al pool directo (/pools/{id}),
// patrón REST de recurso anidado para crear y recurso plano para modificar.
// Apoya las HU del editor de diagramas (modelado de pools).
// =============================================================================
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EditarPoolRequest, PoolRequest, PoolResponse } from '../models/pool.model';

/** Acceso HTTP a los pools de un proceso. */
@Injectable({ providedIn: 'root' })
export class PoolService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  /** Lista los pools de un proceso. GET /procesos/{procesoId}/pools. */
  listar(procesoId: number): Observable<PoolResponse[]> {
    return this.http.get<PoolResponse[]>(`${this.url}/procesos/${procesoId}/pools`);
  }

  /** Crea un pool dentro de un proceso. POST /procesos/{procesoId}/pools. */
  crear(procesoId: number, datos: PoolRequest): Observable<PoolResponse> {
    return this.http.post<PoolResponse>(`${this.url}/procesos/${procesoId}/pools`, datos);
  }

  /** Edita un pool (usa un Request propio de edición, distinto al de creación). PUT /pools/{id}. */
  editar(id: number, datos: EditarPoolRequest): Observable<PoolResponse> {
    return this.http.put<PoolResponse>(`${this.url}/pools/${id}`, datos);
  }

  /** Elimina un pool. DELETE /pools/{id}. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/pools/${id}`);
  }
}
