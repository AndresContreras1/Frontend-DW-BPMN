import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RolAcceso } from '../models/enums.model';
import { PermisoEstructuraRequest, PermisoEstructuraResponse } from '../models/permiso-estructura.model';

@Injectable({ providedIn: 'root' })
export class PermisoEstructuraService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/permisos-estructura`;

  listar(): Observable<PermisoEstructuraResponse[]> {
    return this.http.get<PermisoEstructuraResponse[]>(this.url);
  }

  /** Permisos de estructura del rol del usuario que inició sesión (cualquier rol autenticado). */
  mio(): Observable<PermisoEstructuraResponse> {
    return this.http.get<PermisoEstructuraResponse>(`${this.url}/mio`);
  }

  actualizar(rol: RolAcceso, permisos: PermisoEstructuraRequest): Observable<PermisoEstructuraResponse> {
    return this.http.put<PermisoEstructuraResponse>(`${this.url}/${rol}`, permisos);
  }
}
