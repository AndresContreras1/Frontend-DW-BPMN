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
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly usuarioSignal = signal<UsuarioResponse | null>(this.tokenService.obtenerUsuario());

  readonly usuario = this.usuarioSignal.asReadonly();
  readonly autenticado = computed(() => this.usuarioSignal() !== null);
  readonly esAdministrador = computed(() => this.usuarioSignal()?.rolAcceso === 'ADMINISTRADOR');
  readonly puedeEditar = computed(() => {
    const rol = this.usuarioSignal()?.rolAcceso;
    return rol === 'ADMINISTRADOR' || rol === 'EDITOR';
  });

  login(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.url}/login`, credenciales).pipe(
      tap((respuesta) => {
        this.tokenService.guardarSesion(respuesta.accessToken, respuesta.usuario);
        this.usuarioSignal.set(respuesta.usuario);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.url}/logout`, {});
  }

  /** Borra la sesión local (cierre de sesión o token vencido). */
  limpiarSesion(): void {
    this.tokenService.limpiar();
    this.usuarioSignal.set(null);
  }

  tieneRol(...roles: RolAcceso[]): boolean {
    const rol = this.usuarioSignal()?.rolAcceso;
    return rol !== undefined && roles.includes(rol);
  }
}
