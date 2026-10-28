// Página /usuarios (HU-02): gestión de usuarios de la empresa. Ruta protegida con rolGuard: solo rol de ACCESO ADMINISTRADOR.
// Acciones: listar (activos o desactivados), invitar (genera un enlace; el sistema no envía correos), cambiar el rol de acceso y desactivar/reactivar.
// Conceptos: roles de ACCESO (ROLES_ACCESO), estrategia pesimista (la lista cambia solo cuando el backend confirma),
// desactivación lógica (el usuario no se borra) y regla de no auto-modificarse (el admin no cambia ni desactiva su propia cuenta desde aquí).
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
/** Página de administración de usuarios. */
export class UsuariosComponent implements OnInit {
  /** Servicio HTTP de usuarios (listar, actualizar, desactivar). */
  private readonly usuarioService = inject(UsuarioService);
  /** Toasts de éxito/error. */
  private readonly notificaciones = inject(NotificacionService);
  /** Sesión actual: se usa para impedir que el administrador modifique su propia cuenta (auth.usuario()?.id). */
  readonly auth = inject(AuthService);

  /** Catálogo de roles de acceso (valor + etiqueta) para el select de cada fila. */
  readonly roles = ROLES_ACCESO;
  /** Signal con los usuarios de la vista actual (activos o desactivados). */
  readonly usuarios = signal<UsuarioResponse[]>([]);
  /** Signal: false = lista de activos; true = lista de desactivados. */
  readonly verDesactivados = signal(false);
  /** Signal: spinner mientras se pide la lista. */
  readonly cargando = signal(true);
  /** Última invitación creada, para mostrar su enlace en pantalla. */
  readonly invitacion = signal<InvitacionUsuarioResponse | null>(null);
  /** Usuario elegido para desactivar; mientras no sea null el modal está abierto. */
  readonly usuarioADesactivar = signal<UsuarioResponse | null>(null);
  /** Signal: desactivación en curso. */
  readonly procesando = signal(false);

  /** Carga la lista inicial (activos). */
  ngOnInit(): void {
    this.cargar();
  }

  /** Alterna entre activos y desactivados y recarga desde el backend. */
  cambiarVista(desactivados: boolean): void {
    this.verDesactivados.set(desactivados);
    this.cargar();
  }

  /** Pide la lista. El parámetro de filtro es false para desactivados y undefined (sin filtro, comportamiento por defecto del backend) para activos. */
  cargar(): void {
    this.cargando.set(true);
    this.usuarioService.listar(this.verDesactivados() ? false : undefined).subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.cargando.set(false);
      },
      error: (e: unknown) => {
        this.cargando.set(false);
        // Fallo de carga (401/403/500...): se avisa con el mensaje del ProblemDetail.
        this.notificaciones.error(mensajeDeError(e));
      }
    });
  }

  /** Convierte el valor técnico del rol (p. ej. ADMINISTRADOR) a su etiqueta legible; si no la encuentra, devuelve el valor tal cual. */
  etiquetaRol(rol: RolAcceso): string {
    return this.roles.find((r) => r.valor === rol)?.etiqueta ?? rol;
  }

  /** Arma el enlace completo /invitacion/:token con el origen actual; ese enlace es el que atiende InvitacionComponent. */
  enlaceInvitacion(invitacion: InvitacionUsuarioResponse): string {
    return window.location.origin + '/invitacion/' + invitacion.token;
  }

  /** Handler del output (invitada) del componente de invitar: guarda la invitación para mostrar su enlace y avisa. */
  alInvitar(invitacion: InvitacionUsuarioResponse): void {
    this.invitacion.set(invitacion);
    this.notificaciones.exito('Invitación creada para ' + invitacion.email + '.');
  }

  /** Se llama al cambiar el select de una fila. PATCH solo con el nuevo rolAcceso; al confirmar el backend se reemplaza la fila. */
  cambiarRol(usuario: UsuarioResponse, rol: string): void {
    this.usuarioService.actualizar(usuario.id, { rolAcceso: rol as RolAcceso }).subscribe({
      next: (actualizado) => {
        this.reemplazar(actualizado);
        this.notificaciones.exito('Rol de ' + actualizado.nombre + ' actualizado.');
      },
      error: (e: unknown) => {
        this.notificaciones.error(mensajeDeError(e));
        // Si falló, se fuerza un nuevo arreglo para que la vista se re-renderice y el select vuelva al rol real (el DOM ya había cambiado el valor).
        this.usuarios.update((lista) => [...lista]);
      }
    });
  }

  /** Vuelve a activar un usuario desactivado (actualizar con activo=true). */
  reactivar(usuario: UsuarioResponse): void {
    this.usuarioService.actualizar(usuario.id, { activo: true }).subscribe({
      next: (actualizado) => {
        // Sale de la lista de desactivados cuando el backend confirma.
        this.usuarios.update((lista) => lista.filter((u) => u.id !== actualizado.id));
        this.notificaciones.exito(actualizado.nombre + ' volvió a estar activo.');
      },
      // Fallo (403, 404, 409...): solo se avisa; la fila permanece.
      error: (e: unknown) => this.notificaciones.error(mensajeDeError(e))
    });
  }

  /** Primer paso: guarda el usuario elegido y abre el modal. */
  pedirDesactivar(usuario: UsuarioResponse): void {
    this.usuarioADesactivar.set(usuario);
  }

  /** Cierra el modal sin hacer nada. */
  cancelarDesactivar(): void {
    this.usuarioADesactivar.set(null);
  }

  /** Segundo paso: desactiva en el backend (baja lógica; el usuario ya no puede iniciar sesión pero se conserva su información). */
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

  /** Sustituye en la lista el usuario con el mismo id por la versión actualizada que devolvió el backend (update de signal sin mutar el arreglo). */
  private reemplazar(actualizado: UsuarioResponse): void {
    this.usuarios.update((lista) => lista.map((u) => (u.id === actualizado.id ? actualizado : u)));
  }
}
