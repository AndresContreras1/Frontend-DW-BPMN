import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LaneRequest, LaneResponse, ReordenarLanesRequest } from '../models/lane.model';

@Injectable({ providedIn: 'root' })
export class LaneService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  listar(poolId: number): Observable<LaneResponse[]> {
    return this.http.get<LaneResponse[]>(`${this.url}/pools/${poolId}/lanes`);
  }

  crear(poolId: number, datos: LaneRequest): Observable<LaneResponse> {
    return this.http.post<LaneResponse>(`${this.url}/pools/${poolId}/lanes`, datos);
  }

  editar(id: number, datos: LaneRequest): Observable<LaneResponse> {
    return this.http.put<LaneResponse>(`${this.url}/lanes/${id}`, datos);
  }

  reordenar(poolId: number, datos: ReordenarLanesRequest): Observable<LaneResponse[]> {
    return this.http.patch<LaneResponse[]>(`${this.url}/pools/${poolId}/lanes/orden`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/lanes/${id}`);
  }
}
