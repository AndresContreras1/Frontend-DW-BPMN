import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EditarPoolRequest, PoolRequest, PoolResponse } from '../models/pool.model';

@Injectable({ providedIn: 'root' })
export class PoolService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  listar(procesoId: number): Observable<PoolResponse[]> {
    return this.http.get<PoolResponse[]>(`${this.url}/procesos/${procesoId}/pools`);
  }

  crear(procesoId: number, datos: PoolRequest): Observable<PoolResponse> {
    return this.http.post<PoolResponse>(`${this.url}/procesos/${procesoId}/pools`, datos);
  }

  editar(id: number, datos: EditarPoolRequest): Observable<PoolResponse> {
    return this.http.put<PoolResponse>(`${this.url}/pools/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/pools/${id}`);
  }
}
