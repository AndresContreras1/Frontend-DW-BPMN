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

@Injectable({ providedIn: 'root' })
export class RolProcesoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/roles`;

  listar(): Observable<RolProcesoVistaResponse[]> {
    return this.http.get<RolProcesoVistaResponse[]>(this.url);
  }

  buscar(nombre: string, pagina: number): Observable<PageResponse<RolProcesoConsultaResponse>> {
    let params = new HttpParams().set('pagina', pagina);
    if (nombre) {
      params = params.set('nombre', nombre);
    }
    return this.http.get<PageResponse<RolProcesoConsultaResponse>>(`${this.url}/consulta`, { params });
  }

  obtener(id: number): Observable<RolProcesoVistaResponse> {
    return this.http.get<RolProcesoVistaResponse>(`${this.url}/${id}`);
  }

  crear(datos: RolProcesoRequest): Observable<RolProcesoVistaResponse> {
    return this.http.post<RolProcesoVistaResponse>(this.url, datos);
  }

  editar(id: number, datos: RolProcesoRequest): Observable<RolProcesoVistaResponse> {
    return this.http.put<RolProcesoVistaResponse>(`${this.url}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
