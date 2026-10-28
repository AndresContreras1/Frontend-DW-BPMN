// Barra de navegación principal. Muestra enlaces distintos según la sesión y el rol de acceso del usuario.
// Barra de navegación principal. Muestra enlaces distintos según la sesión y el rol de acceso del usuario.
// Barra de navegación principal. Muestra enlaces distintos según la sesión y el rol de acceso del usuario.
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ROLES_ACCESO } from '../../models/enums.model';
import { AuthService } from '../../service/auth.service';
import { NotificacionService } from '../../service/notificacion.service';

/** Barra superior: enlaces según autenticación y rol, y botón de cerrar sesión. */
/** Barra superior: enlaces según autenticación y rol, y botón de cerrar sesión. */
/** Barra superior: enlaces según autenticación y rol, y botón de cerrar sesión. */
@Component({
  selector: 'app-navbar',
  // RouterLink navega sin recargar la página; RouterLinkActive agrega la clase 'active' al enlace de la ruta actual.
  // RouterLink navega sin recargar la página; RouterLinkActive agrega la clase 'active' al enlace de la ruta actual.
  // RouterLink navega sin recargar la página; RouterLinkActive agrega la clase 'active' al enlace de la ruta actual.
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  /** Servicio de sesión; público porque la plantilla lee auth.autenticado(), auth.usuario() y auth.esAdministrador() (signals). */
  /** Servicio de sesión; público porque la plantilla lee auth.autenticado(), auth.usuario() y auth.esAdministrador() (signals). */
  /** Servicio de sesión; público porque la plantilla lee auth.autenticado(), auth.usuario() y auth.esAdministrador() (signals). */
  readonly auth = inject(AuthService);
  /** Para redirigir al login tras cerrar sesión. */
  /** Para redirigir al login tras cerrar sesión. */
  /** Para redirigir al login tras cerrar sesión. */
  private readonly router = inject(Router);
  /** Para avisar al usuario con un toast. */
  /** Para avisar al usuario con un toast. */
  /** Para avisar al usuario con un toast. */
  private readonly notificaciones = inject(NotificacionService);

  /** Traduce el código del rol (por ejemplo ADMINISTRADOR) a la etiqueta legible usando la constante ROLES_ACCESO. */
  /** Traduce el código del rol (por ejemplo ADMINISTRADOR) a la etiqueta legible usando la constante ROLES_ACCESO. */
  /** Traduce el código del rol (por ejemplo ADMINISTRADOR) a la etiqueta legible usando la constante ROLES_ACCESO. */
  etiquetaRol(): string {
    const rol = this.auth.usuario()?.rolAcceso;
    return ROLES_ACCESO.find((r) => r.valor === rol)?.etiqueta ?? '';
  }

  /**
   * Pide al backend invalidar la sesión. Se ejecuta terminarSesion() tanto si responde bien como si falla:
   * el usuario siempre debe poder salir aunque el servidor no responda.
   */
  /**
   * Pide al backend invalidar la sesión. Se ejecuta terminarSesion() tanto si responde bien como si falla:
   * el usuario siempre debe poder salir aunque el servidor no responda.
   */
  /**
   * Pide al backend invalidar la sesión. Se ejecuta terminarSesion() tanto si responde bien como si falla:
   * el usuario siempre debe poder salir aunque el servidor no responda.
   */
  cerrarSesion(): void {
    this.auth.logout().subscribe({
      next: () => this.terminarSesion(),
      error: () => this.terminarSesion()
    });
  }

  /** Limpia el token local, avisa y lleva al login. 'void' indica que se ignora a propósito la promesa de navigate. */
  /** Limpia el token local, avisa y lleva al login. 'void' indica que se ignora a propósito la promesa de navigate. */
  /** Limpia el token local, avisa y lleva al login. 'void' indica que se ignora a propósito la promesa de navigate. */
  private terminarSesion(): void {
    this.auth.limpiarSesion();
    this.notificaciones.info('Sesión cerrada.');
    void this.router.navigate(['/login']);
  }
}
