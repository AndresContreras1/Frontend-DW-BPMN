// =============================================================================
// arco.service.ts
// Servicio CRUD de ARCOS BPMN (flechas/flujos de secuencia que conectan
// actividades, gateways y eventos de un pool). Conceptos: @Injectable root,
// HttpClient tipado, Observables y consulta de impacto de eliminación.
// Particularidad de diseño: el arco se crea con POST /arcos (origen y destino
// van en el cuerpo, ArcoRequest) porque conecta dos elementos y no cuelga de uno
// solo; en cambio se LISTA por pool, y se edita con un Request distinto
// (EditarArcoRequest) que limita lo que se puede cambiar.
// Apoya las HU del editor de diagramas (conectar elementos del flujo).
// =============================================================================
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ArcoRequest, ArcoResponse, EditarArcoRequest } from '../models/arco.model';
import { ImpactoEliminacionResponse } from '../models/impacto-eliminacion.model';

/** Acceso HTTP a los arcos (flujos de secuencia) de un pool. */
@Injectable({ providedIn: 'root' })
export class ArcoService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  /** Lista los arcos de un pool. GET /pools/{poolId}/arcos. */
  listar(poolId: number): Observable<ArcoResponse[]> {
    return this.http.get<ArcoResponse[]>(`${this.url}/pools/${poolId}/arcos`);
  }

  /** Crea un arco entre dos elementos (origen/destino en el cuerpo). POST /arcos. */
  crear(datos: ArcoRequest): Observable<ArcoResponse> {
    return this.http.post<ArcoResponse>(`${this.url}/arcos`, datos);
  }

  /** Edita un arco (por ejemplo su condición/etiqueta). PUT /arcos/{id}. */
  editar(id: number, datos: EditarArcoRequest): Observable<ArcoResponse> {
    return this.http.put<ArcoResponse>(`${this.url}/arcos/${id}`, datos);
  }

  /** Consulta qué se afectaría al borrar el arco (no borra nada). GET /arcos/{id}/impacto-eliminacion. */
  impactoEliminacion(id: number): Observable<ImpactoEliminacionResponse> {
    return this.http.get<ImpactoEliminacionResponse>(`${this.url}/arcos/${id}/impacto-eliminacion`);
  }

  /** Elimina un arco. DELETE /arcos/{id}. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/arcos/${id}`);
  }
}
