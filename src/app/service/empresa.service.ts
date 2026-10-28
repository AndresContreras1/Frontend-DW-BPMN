// =============================================================================
// empresa.service.ts
// Servicio de EMPRESAS (organizaciones/tenants). Hoy solo expone el registro de
// una empresa nueva. Conceptos: @Injectable root (singleton), HttpClient tipado
// y Observable (la petición se ejecuta al suscribirse; el componente decide qué
// hacer con la respuesta o el error).
// Apoya la HU de registro de empresa.
// =============================================================================
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmpresaResponse, RegistroEmpresaRequest } from '../models/empresa.model';

/** Acceso HTTP al recurso /empresas del backend. */
@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/empresas`;

  /**
   * Registra una empresa nueva. Consume POST /empresas.
   * Los modelos Request/Response tipan lo que se envía y lo que se recibe.
   */
  registrar(datos: RegistroEmpresaRequest): Observable<EmpresaResponse> {
    return this.http.post<EmpresaResponse>(this.url, datos);
  }
}
