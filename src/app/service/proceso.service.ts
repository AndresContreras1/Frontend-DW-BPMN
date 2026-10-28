import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EstadoProceso } from '../models/enums.model';
import { ValidacionModeloResponse } from '../models/validacion-modelo.model';
import { PageResponse } from '../models/pagina.model';
import {
  EditarProcesoRequest,
  FiltrosProceso,
  HistorialCambioResponse,
  ProcesoDetalleResponse,
  ProcesoDiagramaResponse,
  ProcesoRequest,
  ProcesoResponse
} from '../models/proceso.model';

@Injectable({ providedIn: 'root' })
export class ProcesoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/procesos`;

  listar(filtros: FiltrosProceso = {}): Observable<PageResponse<ProcesoResponse>> {
    let params = new HttpParams();
    if (filtros.nombre) {
      params = params.set('nombre', filtros.nombre);
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.categoria) {
      params = params.set('categoria', filtros.categoria);
    }
    if (filtros.activo !== undefined) {
      params = params.set('activo', filtros.activo);
    }
    params = params.set('pagina', filtros.pagina ?? 0);
    return this.http.get<PageResponse<ProcesoResponse>>(this.url, { params });
  }

  obtener(id: number): Observable<ProcesoDetalleResponse> {
    return this.http.get<ProcesoDetalleResponse>(`${this.url}/${id}`);
  }

  crear(datos: ProcesoRequest): Observable<ProcesoResponse> {
    return this.http.post<ProcesoResponse>(this.url, datos);
  }

  editar(id: number, datos: EditarProcesoRequest): Observable<ProcesoResponse> {
    return this.http.put<ProcesoResponse>(`${this.url}/${id}`, datos);
  }

  cambiarEstado(id: number, estado: EstadoProceso): Observable<ProcesoResponse> {
    return this.http.patch<ProcesoResponse>(`${this.url}/${id}`, { estado });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  diagrama(id: number): Observable<ProcesoDiagramaResponse> {
    return this.http.get<ProcesoDiagramaResponse>(`${this.url}/${id}/diagrama`);
  }

  /** Todas las advertencias que impedirían publicar el proceso (no modifica nada). */
  validacion(id: number): Observable<ValidacionModeloResponse> {
    return this.http.get<ValidacionModeloResponse>(`${this.url}/${id}/validacion`);
  }

  historial(id: number): Observable<HistorialCambioResponse[]> {
    return this.http.get<HistorialCambioResponse[]>(`${this.url}/${id}/historial`);
  }
}
