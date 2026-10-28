import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { GatewayRequest, GatewayResponse } from '../models/gateway.model';
import { ImpactoEliminacionResponse } from '../models/impacto-eliminacion.model';

@Injectable({ providedIn: 'root' })
export class GatewayService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  listar(laneId: number): Observable<GatewayResponse[]> {
    return this.http.get<GatewayResponse[]>(`${this.url}/lanes/${laneId}/gateways`);
  }

  crear(laneId: number, datos: GatewayRequest): Observable<GatewayResponse> {
    return this.http.post<GatewayResponse>(`${this.url}/lanes/${laneId}/gateways`, datos);
  }

  editar(id: number, datos: GatewayRequest): Observable<GatewayResponse> {
    return this.http.put<GatewayResponse>(`${this.url}/gateways/${id}`, datos);
  }

  impactoEliminacion(id: number): Observable<ImpactoEliminacionResponse> {
    return this.http.get<ImpactoEliminacionResponse>(`${this.url}/gateways/${id}/impacto-eliminacion`);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/gateways/${id}`);
  }
}
