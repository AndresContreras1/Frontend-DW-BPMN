// =============================================================================
// proceso.service.ts
// Servicio CRUD del PROCESO BPMN (entidad raíz: de ella cuelgan pools, lanes,
// actividades, arcos, mensajes...). Conceptos: @Injectable root, HttpClient
// tipado, Observables, HttpParams para filtros opcionales + paginación,
// PageResponse<T> genérico, y PATCH para un cambio parcial (solo el estado).
// Apoya las HU de gestión de procesos (listar con filtros, crear, editar,
// publicar/cambiar estado, eliminar), consulta del diagrama, validación del
// modelo antes de publicar e historial de cambios.
// =============================================================================
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

/** Acceso HTTP al recurso /procesos del backend. */
@Injectable({ providedIn: 'root' })
export class ProcesoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/procesos`;

  /**
   * Lista procesos con filtros opcionales y paginación. GET /procesos?nombre&estado&categoria&activo&pagina.
   * Los filtros se pasan en un objeto (por defecto vacío {}). HttpParams es
   * INMUTABLE: cada set() devuelve una instancia nueva, por eso se reasigna.
   * Solo se envía un filtro si el usuario lo eligió (así no se mandan parámetros
   * vacíos). activo se compara con undefined porque false es un valor válido
   * (ver procesos inactivos). La página siempre se envía, por defecto 0.
   */
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

  /** Obtiene el detalle de un proceso. GET /procesos/{id}. */
  obtener(id: number): Observable<ProcesoDetalleResponse> {
    return this.http.get<ProcesoDetalleResponse>(`${this.url}/${id}`);
  }

  /** Crea un proceso. POST /procesos. */
  crear(datos: ProcesoRequest): Observable<ProcesoResponse> {
    return this.http.post<ProcesoResponse>(this.url, datos);
  }

  /** Edita los datos de un proceso. PUT /procesos/{id}. */
  editar(id: number, datos: EditarProcesoRequest): Observable<ProcesoResponse> {
    return this.http.put<ProcesoResponse>(`${this.url}/${id}`, datos);
  }

  /**
   * Cambia solo el estado del proceso (p. ej. borrador a publicado). PATCH /procesos/{id}
   * con cuerpo { estado }. PATCH y no PUT porque es una modificación parcial.
   */
  cambiarEstado(id: number, estado: EstadoProceso): Observable<ProcesoResponse> {
    return this.http.patch<ProcesoResponse>(`${this.url}/${id}`, { estado });
  }

  /** Elimina un proceso. DELETE /procesos/{id}. */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** Trae el diagrama completo (pools, lanes, elementos y arcos) para dibujarlo. GET /procesos/{id}/diagrama. */
  diagrama(id: number): Observable<ProcesoDiagramaResponse> {
    return this.http.get<ProcesoDiagramaResponse>(`${this.url}/${id}/diagrama`);
  }

  /** Todas las advertencias que impedirían publicar el proceso (no modifica nada). GET /procesos/{id}/validacion. */
  validacion(id: number): Observable<ValidacionModeloResponse> {
    return this.http.get<ValidacionModeloResponse>(`${this.url}/${id}/validacion`);
  }

  /** Historial de cambios (auditoría) del proceso. GET /procesos/{id}/historial. */
  historial(id: number): Observable<HistorialCambioResponse[]> {
    return this.http.get<HistorialCambioResponse[]>(`${this.url}/${id}/historial`);
  }
}
