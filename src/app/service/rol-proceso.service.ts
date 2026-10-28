// =============================================================================
// rol-proceso.service.ts
// Servicio CRUD de ROLES DE PROCESO (los responsables/actores que se asignan a
// las lanes y actividades de un proceso BPMN). Conceptos: @Injectable root,
// HttpClient tipado, HttpParams (parámetros de consulta ?pagina=..&nombre=..) y
// PageResponse<T> (modelo genérico de respuesta paginada del backend).
// Apoya las HU de administración de roles de proceso (crear, editar, buscar, eliminar).
// =============================================================================
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PageResponse } from '../models/pagina.model';
import {
  RolProcesoConsultaResponse,
  RolProcesoRequest,
  RolProcesoVistaResponse
} from '../models/rol-proceso.model';

/** Acceso HTTP al recurso /roles del backend. */
@Injectable({ providedIn: 'root' })
export class RolProcesoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/roles`;

  /** Lista todos los roles (sin paginar, p. ej. para llenar un select). GET /roles. */
  listar(): Observable<RolProcesoVistaResponse[]> {
    return this.http.get<RolProcesoVistaResponse[]>(this.url);
  }

  /**
   * Búsqueda paginada por nombre. GET /roles/consulta?pagina=N[&nombre=X].
   * HttpParams es INMUTABLE: set() devuelve una instancia nueva, por eso se
   * reasigna (params = params.set(...)). El filtro nombre solo se añade si el
   * usuario escribió algo; así no se envía un parámetro vacío.
   */
  buscar(nombre: string, pagina: number): Observable<PageResponse<RolProcesoConsultaResponse>> {
    let params = new HttpParams().set('pagina', pagina);
    if (nombre) {
      params = params.set('nombre', nombre);
    }
    return this.http.get<PageResponse<RolProcesoConsultaResponse>>(`${this.url}/consulta`, { params });
  }

  /** Obtiene un rol por id. GET /roles/{id}. */
  obtener(id: number): Observable<RolProcesoVistaResponse> {
    return this.http.get<RolProcesoVistaResponse>(`${this.url}/${id}`);
  }

  /** Crea un rol. POST /roles. */
  crear(datos: RolProcesoRequest): Observable<RolProcesoVistaResponse> {
    return this.http.post<RolProcesoVistaResponse>(this.url, datos);
  }

  /** Reemplaza los datos de un rol. PUT /roles/{id}. */
  editar(id: number, datos: RolProcesoRequest): Observable<RolProcesoVistaResponse> {
    return this.http.put<RolProcesoVistaResponse>(`${this.url}/${id}`, datos);
  }

  /** Elimina un rol. DELETE /roles/{id} (sin cuerpo de respuesta: Observable<void>). */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
