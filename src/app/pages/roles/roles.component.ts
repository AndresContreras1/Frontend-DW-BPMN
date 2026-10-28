// Página /roles (HU-17 a HU-20): CRUD del catálogo de ROLES DE PROCESO (responsabilidades como "Analista" o "Aprobador").
// Ruta protegida con rolGuard: solo el rol de ACCESO ADMINISTRADOR entra (ver app.routes.ts).
// Diferencia clave: rol de ACCESO = permisos del usuario en el sistema (ADMINISTRADOR/EDITOR/SOLO_LECTURA);
// rol de PROCESO = responsabilidad que nombra una lane dentro de un diagrama.
// Conceptos: búsqueda paginada, formulario hijo reutilizable para crear/editar, eliminación pesimista con modal,
// y regla de negocio: un rol en uso por algún proceso no se puede eliminar (el backend lo respondería con 409).
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CampoFormularioComponent } from '../../components/campo-formulario/campo-formulario.component';
import { EstadoVacioComponent } from '../../components/estado-vacio/estado-vacio.component';
import { ModalConfirmacionComponent } from '../../components/modal-confirmacion/modal-confirmacion.component';
import { PaginadorComponent } from '../../components/paginador/paginador.component';
import { RolProcesoFormComponent } from '../../components/rol-proceso-form/rol-proceso-form.component';
import { SpinnerCargaComponent } from '../../components/spinner-carga/spinner-carga.component';
import { PageResponse } from '../../models/pagina.model';
import { RolProcesoConsultaResponse, RolProcesoRequest } from '../../models/rol-proceso.model';
import { NotificacionService } from '../../service/notificacion.service';
import { RolProcesoService } from '../../service/rol-proceso.service';
import { erroresPorCampo, mensajeDeError } from '../../utils/problema';

/**
 * HU-17 a HU-20: catálogo de roles de proceso (responsabilidades que nombran las lanes).
 * No confundir con el rol de acceso del usuario (administrador, editor, solo lectura).
 */
@Component({
  selector: 'app-roles',
  imports: [
    ReactiveFormsModule,
    CampoFormularioComponent,
    EstadoVacioComponent,
    ModalConfirmacionComponent,
    PaginadorComponent,
    RolProcesoFormComponent,
    SpinnerCargaComponent
  ],
  templateUrl: './roles.component.html'
})
/** Página de gestión de roles de proceso. Muestra tabla paginada, formulario de alta/edición y modal de eliminación. */
export class RolesComponent implements OnInit {
  /** Servicio HTTP del catálogo de roles de proceso (buscar, crear, editar, eliminar). */
  private readonly rolService = inject(RolProcesoService);
  /** Toasts de éxito y error. */
  private readonly notificaciones = inject(NotificacionService);

  /** Control reactivo del cuadro de búsqueda por nombre (un FormControl suelto, sin FormGroup, porque es un solo campo). */
  readonly busqueda = new FormControl('', { nonNullable: true });
  /** Signal con la página actual devuelta por el backend (paginación del lado del servidor). */
  readonly pagina = signal<PageResponse<RolProcesoConsultaResponse> | null>(null);
  /** Signal: spinner mientras se pide la lista. */
  readonly cargando = signal(true);
  /** Signal con el mensaje de error de carga. */
  readonly error = signal('');

  /** Signal: true muestra el formulario de alta/edición encima de la tabla. */
  readonly formularioAbierto = signal(false);
  /** Rol que se está editando; null significa modo "nuevo". */
  readonly rolEnEdicion = signal<RolProcesoConsultaResponse | null>(null);
  /** Signal: guardado en curso (bloquea el botón del formulario hijo). */
  readonly enviando = signal(false);
  /** Errores por campo (400) del backend para mostrarlos en el formulario hijo. */
  readonly erroresForm = signal<Record<string, string | undefined>>({});

  /** Rol elegido para eliminar; mientras no sea null el modal está abierto. */
  readonly rolAEliminar = signal<RolProcesoConsultaResponse | null>(null);
  /** Signal: eliminación en curso. */
  readonly eliminando = signal(false);

  /** Al abrir la página carga la primera página (índice 0). */
  ngOnInit(): void {
    this.cargar(0);
  }

  /** Aplica el texto de búsqueda empezando en la primera página. */
  buscar(): void {
    this.cargar(0);
  }

  /** Pide al backend la página indicada filtrando por el nombre escrito. El paginador también llama aquí con (cambiarPagina). */
  cargar(numeroPagina: number): void {
    this.cargando.set(true);
    this.error.set('');
    this.rolService.buscar(this.busqueda.value.trim(), numeroPagina).subscribe({
      // Éxito: reemplaza la página y apaga el spinner.
      next: (respuesta) => {
        this.pagina.set(respuesta);
        this.cargando.set(false);
      },
      // Fallo (401/403/500...): apaga el spinner y muestra el mensaje del ProblemDetail.
      error: (e: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(e));
      }
    });
  }

  /** Abre el formulario en modo creación (sin rol en edición y sin errores previos). */
  nuevo(): void {
    this.rolEnEdicion.set(null);
    this.erroresForm.set({});
    this.formularioAbierto.set(true);
  }

  /** Abre el formulario en modo edición con el rol elegido de la tabla. */
  editar(rol: RolProcesoConsultaResponse): void {
    this.rolEnEdicion.set(rol);
    this.erroresForm.set({});
    this.formularioAbierto.set(true);
  }

  /** Oculta el formulario y limpia el rol en edición. */
  cerrarFormulario(): void {
    this.formularioAbierto.set(false);
    this.rolEnEdicion.set(null);
  }

  /**
   * Recibe los datos válidos del formulario hijo. Si hay rolEnEdicion hace PUT (editar); si no, POST (crear).
   * Pesimista: el formulario se cierra y la lista se recarga solo cuando el backend confirma.
   */
  guardar(datos: RolProcesoRequest): void {
    const rol = this.rolEnEdicion();
    this.enviando.set(true);
    this.erroresForm.set({});
    // Observable frío: la petición solo sale al hacer subscribe.
    const peticion = rol ? this.rolService.editar(rol.id, datos) : this.rolService.crear(datos);
    peticion.subscribe({
      next: (guardado) => {
        this.enviando.set(false);
        this.notificaciones.exito('Rol de proceso "' + guardado.nombre + '" ' + (rol ? 'actualizado.' : 'creado.'));
        this.cerrarFormulario();
        // Recarga la misma página para ver el cambio reflejado tal como lo guardó el backend.
        this.cargar(this.pagina()?.page ?? 0);
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        // Fallo: 400 con errores por campo (se pintan en el formulario) o 409 de nombre duplicado (mensaje general en el toast).
        this.erroresForm.set(erroresPorCampo(e));
        this.notificaciones.error(mensajeDeError(e));
      }
    });
  }

  /** Primer paso: abre el modal de confirmación guardando el rol elegido. */
  pedirEliminar(rol: RolProcesoConsultaResponse): void {
    this.rolAEliminar.set(rol);
  }

  /** Cierra el modal sin eliminar. */
  cancelarEliminar(): void {
    this.rolAEliminar.set(null);
  }

  /** Segundo paso: elimina en el backend. Estrategia pesimista: la fila desaparece solo cuando se recarga tras la confirmación. */
  confirmarEliminar(): void {
    const rol = this.rolAEliminar();
    if (!rol) {
      return;
    }
    this.eliminando.set(true);
    this.rolService.eliminar(rol.id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.rolAEliminar.set(null);
        this.notificaciones.exito('Rol de proceso "' + rol.nombre + '" eliminado.');
        const actual = this.pagina();
        // Si se eliminó el único elemento de una página que no es la primera, retrocede una página para no quedar en una vacía.
        this.cargar(actual && actual.content.length === 1 && actual.page > 0 ? actual.page - 1 : (actual?.page ?? 0));
      },
      error: (e: unknown) => {
        this.eliminando.set(false);
        this.rolAEliminar.set(null);
        // Fallo al eliminar (p. ej. 409 si el rol está en uso, 404 si ya no existe): se cierra el modal y se avisa; la lista no cambia.
        this.notificaciones.error(mensajeDeError(e));
      }
    });
  }
}
