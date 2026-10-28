import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CompartirProcesoRequest,
  ProcesoCompartidoDetalleResponse,
  ProcesoCompartidoResponse
} from '../models/proceso-compartido.model';

@Injectable({ providedIn: 'root' })
export class ProcesoCompartidoService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  listarDeProceso(procesoId: number): Observable<ProcesoCompartidoResponse[]> {
    return this.http.get<ProcesoCompartidoResponse[]>(`${this.url}/procesos/${procesoId}/compartidos`);
  }

  compartir(procesoId: number, datos: CompartirProcesoRequest): Observable<ProcesoCompartidoResponse> {
    return this.http.post<ProcesoCompartidoResponse>(`${this.url}/procesos/${procesoId}/compartidos`, datos);
  }

  dejarDeCompartir(procesoId: number, empresaInvitadaId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/procesos/${procesoId}/compartidos/${empresaInvitadaId}`);
  }

  listarRecibidos(): Observable<ProcesoCompartidoResponse[]> {
    return this.http.get<ProcesoCompartidoResponse[]>(`${this.url}/procesos-compartidos`);
  }

  detalle(procesoId: number): Observable<ProcesoCompartidoDetalleResponse> {
    return this.http.get<ProcesoCompartidoDetalleResponse>(`${this.url}/procesos-compartidos/${procesoId}`);
  }
}
