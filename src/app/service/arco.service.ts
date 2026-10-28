import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ArcoRequest, ArcoResponse, EditarArcoRequest } from '../models/arco.model';
import { ImpactoEliminacionResponse } from '../models/impacto-eliminacion.model';

@Injectable({ providedIn: 'root' })
export class ArcoService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl;

  listar(poolId: number): Observable<ArcoResponse[]> {
    return this.http.get<ArcoResponse[]>(`${this.url}/pools/${poolId}/arcos`);
  }

  crear(datos: ArcoRequest): Observable<ArcoResponse> {
    return this.http.post<ArcoResponse>(`${this.url}/arcos`, datos);
  }

  editar(id: number, datos: EditarArcoRequest): Observable<ArcoResponse> {
    return this.http.put<ArcoResponse>(`${this.url}/arcos/${id}`, datos);
  }

  impactoEliminacion(id: number): Observable<ImpactoEliminacionResponse> {
    return this.http.get<ImpactoEliminacionResponse>(`${this.url}/arcos/${id}/impacto-eliminacion`);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/arcos/${id}`);
  }
}
