import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ROLES_ACCESO } from '../../models/enums.model';
import { AuthService } from '../../service/auth.service';
import { NotificacionService } from '../../service/notificacion.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);

  etiquetaRol(): string {
    const rol = this.auth.usuario()?.rolAcceso;
    return ROLES_ACCESO.find((r) => r.valor === rol)?.etiqueta ?? '';
  }

  cerrarSesion(): void {
    this.auth.logout().subscribe({
      next: () => this.terminarSesion(),
      error: () => this.terminarSesion()
    });
  }

  private terminarSesion(): void {
    this.auth.limpiarSesion();
    this.notificaciones.info('Sesión cerrada.');
    void this.router.navigate(['/login']);
  }
}
