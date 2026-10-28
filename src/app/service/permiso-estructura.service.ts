// =============================================================================
// permiso-estructura.service.ts
// Servicio de PERMISOS DE ESTRUCTURA: define qué operaciones sobre la estructura
// del diagrama (crear/editar/eliminar elementos) puede hacer cada rol de acceso
// (ADMINISTRADOR, EDITOR, SOLO_LECTURA). El administrador los configura; el editor del
// diagrama consulta los propios (mio) para habilitar o deshabilitar botones.
// Conceptos: @Injectable root, HttpClient tipado, Observables, tipo enum RolAcceso
// como parte de la ruta.
// Apoya las HU de control de acceso por rol.
// =============================================================================
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RolAcceso } from '../models/enums.model';
import { PermisoEstructuraRequest, PermisoEstructuraResponse } from '../models/permiso-estructura.model';

/** Acceso HTTP al recurso /permisos-estructura del backend. */
@Injectable({ providedIn: 'root' })
export class PermisoEstructuraService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/permisos-estructura`;

  /** Lista los permisos de todos los roles (pantalla de administración). GET /permisos-estructura. */
  listar(): Observable<PermisoEstructuraResponse[]> {
    return this.http.get<PermisoEstructuraResponse[]>(this.url);
  }

  /**
   * Permisos de estructura del rol del usuario que inició sesión (cualquier rol autenticado).
   * GET /permisos-estructura/mio. El backend deduce el rol desde el token, por eso
   * no se envía ningún id.
   */
  mio(): Observable<PermisoEstructuraResponse> {
    return this.http.get<PermisoEstructuraResponse>(`${this.url}/mio`);
  }

  /** Cambia los permisos de un rol. PUT /permisos-estructura/{rol}. */
  actualizar(rol: RolAcceso, permisos: PermisoEstructuraRequest): Observable<PermisoEstructuraResponse> {
    return this.http.put<PermisoEstructuraResponse>(`${this.url}/${rol}`, permisos);
  }
}
