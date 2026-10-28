// =============================================================================
// auth.service.ts
// Servicio de AUTENTICACIÓN: habla con el backend (/auth) y mantiene el estado
// del usuario actual para toda la app.
// Conceptos aplicados:
//  - @Injectable providedIn 'root': singleton compartido.
//  - inject() para inyección de dependencias (estilo funcional de Angular 19).
//  - HttpClient tipado: http.post<LoginResponse>(...) devuelve Observable<LoginResponse>.
//  - Observable + operador tap: efecto secundario (guardar sesión) sin alterar
//    el valor que recibe quien se suscribe.
//  - Signals (signal / computed / asReadonly): estado reactivo compartido; los
//    componentes y guards leen usuario(), autenticado(), etc. y se actualizan solos.
// Apoya las HU de inicio/cierre de sesión y control de acceso por rol.
// =============================================================================
import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/auth.model';
import { RolAcceso } from '../models/enums.model';
import { UsuarioResponse } from '../models/usuario.model';
import { TokenService } from './token.service';

/** Login/logout contra el backend y estado compartido del usuario actual. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  // URL base de este recurso; la raíz sale de environment para cambiar de
  // ambiente (dev/prod) sin tocar el código.
  private readonly url = `${environment.apiUrl}/auth`;

  // Señal privada y ESCRIBIBLE: solo este servicio puede cambiarla. Arranca con
  // el usuario guardado en localStorage, así la sesión sobrevive a recargar.
  private readonly usuarioSignal = signal<UsuarioResponse | null>(this.tokenService.obtenerUsuario());

  // Versión de solo lectura que se expone: el resto de la app consulta pero no
  // puede modificar el estado (encapsulamiento).
  readonly usuario = this.usuarioSignal.asReadonly();
  // computed: valores derivados que se recalculan solos cuando cambia el usuario.
  readonly autenticado = computed(() => this.usuarioSignal() !== null);
  readonly esAdministrador = computed(() => this.usuarioSignal()?.rolAcceso === 'ADMINISTRADOR');
  // Permiso de edición de diagramas: ADMINISTRADOR y EDITOR (el rol SOLO_LECTURA solo ve).
  readonly puedeEditar = computed(() => {
    const rol = this.usuarioSignal()?.rolAcceso;
    return rol === 'ADMINISTRADOR' || rol === 'EDITOR';
  });

  /**
   * Inicia sesión. Consume POST /auth/login.
   * El tap guarda token+usuario en localStorage y actualiza la señal cuando el
   * backend responde bien; el Observable sigue entregando la respuesta al
   * componente que llamó (para redirigir, mostrar errores, etc.).
   */
  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.url}/login`, credenciales).pipe(
      tap((respuesta) => {
        this.tokenService.guardarSesion(respuesta.accessToken, respuesta.usuario);
        this.usuarioSignal.set(respuesta.usuario);
      })
    );
  }

  /**
   * Avisa al backend del cierre de sesión. Consume POST /auth/logout (cuerpo vacío).
   * No limpia nada local: eso lo hace limpiarSesion(), que el componente invoca
   * después.
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${this.url}/logout`, {});
  }

  /** Borra la sesión local (cierre de sesión o token vencido). */
  limpiarSesion(): void {
    this.tokenService.limpiar();
    this.usuarioSignal.set(null);
  }

  /**
   * Indica si el usuario actual tiene alguno de los roles dados (parámetro rest).
   * Útil en guards y plantillas para mostrar/ocultar opciones por rol.
   */
  tieneRol(...roles: RolAcceso[]): boolean {
    const rol = this.usuarioSignal()?.rolAcceso;
    return rol !== undefined && roles.includes(rol);
  }
}
