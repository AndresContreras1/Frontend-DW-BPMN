// =============================================================================
// gateway.service.ts
// Servicio CRUD de GATEWAYS BPMN (compuertas de decisión/paralelismo dentro de
// una lane). Conceptos: @Injectable root, HttpClient tipado, Observables y
// consulta previa de impacto de eliminación (confirmación informada).
// Listar/crear cuelgan de la lane; editar/eliminar apuntan al gateway directo.
// Apoya las HU del editor de diagramas (modelado de gateways).
// =============================================================================
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GatewayRequest, GatewayResponse } from '../models/gateway.model';
import { ImpactoEliminacionResponse } from '../models/impacto-eliminacion.model';

/** Acceso HTTP a los gateways de una lane. */
@Injectable({ providedIn: 'root' })
export class GatewayService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  /** Lista los gateways de una lane. GET /lanes/{laneId}/gateways. */
  listar(laneId: number): Observable<GatewayResponse[]> {
    return this.http.get<GatewayResponse[]>(`${this.url}/lanes/${laneId}/gateways`);
  }

  /** Crea un gateway en una lane. POST /lanes/{laneId}/gateways. */
  crear(laneId: number, datos: GatewayRequest): Observable<GatewayResponse> {
    return this.http.post<GatewayResponse>(`${this.url}/lanes/${laneId}/gateways`, datos);
  }

  /** Edita un gateway (también para moverlo de lane). PUT /gateways/{id}. */
  editar(id: number, datos: GatewayRequest): Observable<GatewayResponse> {
    return this.http.put<GatewayResponse>(`${this.url}/gateways/${id}`, datos);
  }

  /** Consulta qué se afectaría al borrar el gateway (no borra nada). GET /gateways/{id}/impacto-eliminacion. */
  impactoEliminacion(id: number): Observable<ImpactoEliminacionResponse> {
    return this.http.get<ImpactoEliminacionResponse>(`${this.url}/gateways/${id}/impacto-eliminacion`);
  }

  /** Elimina un gateway. DELETE /gateways/{id}. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/gateways/${id}`);
  }
}
