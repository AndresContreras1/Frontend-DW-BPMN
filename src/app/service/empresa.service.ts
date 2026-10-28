import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmpresaResponse, RegistroEmpresaRequest } from '../models/empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/empresas`;

  registrar(datos: RegistroEmpresaRequest): Observable<EmpresaResponse> {
    return this.http.post<EmpresaResponse>(this.url, datos);
  }
}
