import { Component, inject, OnInit, signal } from '@angular/core';
import { EstadoVacioComponent } from '../../components/estado-vacio/estado-vacio.component';
import { InvitarUsuarioComponent } from '../../components/invitar-usuario/invitar-usuario.component';
import { ModalConfirmacionComponent } from '../../components/modal-confirmacion/modal-confirmacion.component';
import { SpinnerCargaComponent } from '../../components/spinner-carga/spinner-carga.component';
import { ROLES_ACCESO, RolAcceso } from '../../models/enums.model';
import { InvitacionUsuarioResponse, UsuarioResponse } from '../../models/usuario.model';
import { AuthService } from '../../service/auth.service';
import { NotificacionService } from '../../service/notificacion.service';
import { UsuarioService } from '../../service/usuario.service';
import { mensajeDeError } from '../../utils/problema';

/** HU-02: usuarios de la empresa (listar, invitar, cambiar rol de acceso, desactivar). */
@Component({
  selector: 'app-usuarios',
  imports: [InvitarUsuarioComponent, ModalConfirmacionComponent, SpinnerCargaComponent, EstadoVacioComponent],
  templateUrl: './usuarios.component.html'
})
export class UsuariosComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly notificaciones = inject(NotificacionService);
  readonly auth = inject(AuthService);

  readonly roles = ROLES_ACCESO;
  readonly usuarios = signal<UsuarioResponse[]>([]);
  readonly verDesactivados = signal(false);
  readonly cargando = signal(true);
  readonly invitacion = signal<InvitacionUsuarioResponse | null>(null);
  readonly usuarioADesactivar = signal<UsuarioResponse | null>(null);
  readonly procesando = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cambiarVista(desactivados: boolean): void {
    this.verDesactivados.set(desactivados);
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.usuarioService.listar(this.verDesactivados() ? false : undefined).subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.cargando.set(false);
      },
      error: (e: unknown) => {
        this.cargando.set(false);
        this.notificaciones.error(mensajeDeError(e));
      }
    });
  }

  etiquetaRol(rol: RolAcceso): string {
    return this.roles.find((r) => r.valor === rol)?.etiqueta ?? rol;
  }

  enlaceInvitacion(invitacion: InvitacionUsuarioResponse): string {
    return window.location.origin + '/invitacion/' + invitacion.token;
  }

  alInvitar(invitacion: InvitacionUsuarioResponse): void {
    this.invitacion.set(invitacion);
    this.notificaciones.exito('Invitación creada para ' + invitacion.email + '.');
  }

  cambiarRol(usuario: UsuarioResponse, rol: string): void {
    this.usuarioService.actualizar(usuario.id, { rolAcceso: rol as RolAcceso }).subscribe({
      next: (actualizado) => {
        this.reemplazar(actualizado);
        this.notificaciones.exito('Rol de ' + actualizado.nombre + ' actualizado.');
      },
      error: (e: unknown) => {
        this.notificaciones.error(mensajeDeError(e));
        this.usuarios.update((lista) => [...lista]);
      }
    });
  }

  reactivar(usuario: UsuarioResponse): void {
    this.usuarioService.actualizar(usuario.id, { activo: true }).subscribe({
      next: (actualizado) => {
        // Sale de la lista de desactivados cuando el backend confirma.
        this.usuarios.update((lista) => lista.filter((u) => u.id !== actualizado.id));
        this.notificaciones.exito(actualizado.nombre + ' volvió a estar activo.');
      },
      error: (e: unknown) => this.notificaciones.error(mensajeDeError(e))
    });
  }

  pedirDesactivar(usuario: UsuarioResponse): void {
    this.usuarioADesactivar.set(usuario);
  }

  cancelarDesactivar(): void {
    this.usuarioADesactivar.set(null);
  }

  confirmarDesactivar(): void {
    const usuario = this.usuarioADesactivar();
    if (!usuario) {
      return;
    }
    this.procesando.set(true);
    this.usuarioService.desactivar(usuario.id).subscribe({
      next: () => {
        // La fila cambia solo cuando el backend confirma. El usuario no se borra: queda inactivo.
        this.usuarios.update((lista) => lista.filter((u) => u.id !== usuario.id));
        this.procesando.set(false);
        this.usuarioADesactivar.set(null);
        this.notificaciones.exito(usuario.nombre + ' quedó desactivado.');
      },
      error: (e: unknown) => {
        this.procesando.set(false);
        this.usuarioADesactivar.set(null);
        this.notificaciones.error(mensajeDeError(e));
      }
    });
  }

  private reemplazar(actualizado: UsuarioResponse): void {
    this.usuarios.update((lista) => lista.map((u) => (u.id === actualizado.id ? actualizado : u)));
  }
}
