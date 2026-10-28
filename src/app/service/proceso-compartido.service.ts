// =============================================================================
// proceso-compartido.service.ts
// Servicio para COMPARTIR procesos BPMN entre empresas: la empresa dueña invita
// a otra y esta los ve en modo consulta. Conceptos: @Injectable root, HttpClient
// tipado, Observables; los parámetros de ruta (path params) se arman con
// plantillas de texto.
// Apoya las HU de compartir un proceso con otra empresa y consultar los recibidos.
// =============================================================================
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CompartirProcesoRequest,
  ProcesoCompartidoDetalleResponse,
  ProcesoCompartidoResponse
} from '../models/proceso-compartido.model';

/** Acceso HTTP a los recursos de procesos compartidos (enviados y recibidos). */
@Injectable({ providedIn: 'root' })
export class ProcesoCompartidoService {
  private readonly http = inject(HttpClient);
  // Aquí la URL es la raíz de la API porque hay dos rutas base distintas
  // (/procesos/... y /procesos-compartidos/...).
  private readonly url = environment.apiUrl;

  /** Lista las empresas con las que se compartió un proceso. GET /procesos/{procesoId}/compartidos. */
  listarDeProceso(procesoId: number): Observable<ProcesoCompartidoResponse[]> {
    return this.http.get<ProcesoCompartidoResponse[]>(`${this.url}/procesos/${procesoId}/compartidos`);
  }

  /** Comparte un proceso con otra empresa. POST /procesos/{procesoId}/compartidos. */
  compartir(procesoId: number, datos: CompartirProcesoRequest): Observable<ProcesoCompartidoResponse> {
    return this.http.post<ProcesoCompartidoResponse>(`${this.url}/procesos/${procesoId}/compartidos`, datos);
  }

  /** Revoca el acceso de una empresa invitada. DELETE /procesos/{procesoId}/compartidos/{empresaInvitadaId}. */
  dejarDeCompartir(procesoId: number, empresaInvitadaId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/procesos/${procesoId}/compartidos/${empresaInvitadaId}`);
  }

  /** Lista los procesos que otras empresas compartieron con la mía. GET /procesos-compartidos. */
  listarRecibidos(): Observable<ProcesoCompartidoResponse[]> {
    return this.http.get<ProcesoCompartidoResponse[]>(`${this.url}/procesos-compartidos`);
  }

  /** Trae el detalle (diagrama) de un proceso compartido recibido. GET /procesos-compartidos/{procesoId}. */
  detalle(procesoId: number): Observable<ProcesoCompartidoDetalleResponse> {
    return this.http.get<ProcesoCompartidoDetalleResponse>(`${this.url}/procesos-compartidos/${procesoId}`);
  }
}
