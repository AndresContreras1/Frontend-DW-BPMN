// Página /procesos (HU-04 y HU-06): listado de procesos de la empresa con filtros, paginación del lado del servidor y eliminación lógica.
// Conceptos que se explican aquí:
// - Formulario reactivo de filtros (nombre, categoría, estado, visibilidad) que se traduce a parámetros de la petición.
// - Paginación: el backend devuelve una página (PageResponse); la UI pide la página N con cargar(N).
// - Roles de ACCESO (ADMINISTRADOR/EDITOR/SOLO_LECTURA) vía AuthService: puedeEditar() muestra "Nuevo proceso" y esAdministrador() permite eliminar.
// - Estrategia PESIMISTA al eliminar: la fila no se quita hasta que el backend confirma; recién entonces se recarga la lista.
// - Manejo de errores 400/401/403/404/409 con mensajeDeError (ProblemDetail).
// Ruta protegida con authGuard (cualquier usuario autenticado).
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CampoFormularioComponent } from '../../components/campo-formulario/campo-formulario.component';
import { EstadoVacioComponent } from '../../components/estado-vacio/estado-vacio.component';
import { ModalConfirmacionComponent } from '../../components/modal-confirmacion/modal-confirmacion.component';
import { PaginadorComponent } from '../../components/paginador/paginador.component';
import { SpinnerCargaComponent } from '../../components/spinner-carga/spinner-carga.component';
import { TablaProcesosComponent } from '../../components/tabla-procesos/tabla-procesos.component';
import { ESTADOS_PROCESO, EstadoProceso, OpcionLista } from '../../models/enums.model';
import { PageResponse } from '../../models/pagina.model';
import { ProcesoResponse } from '../../models/proceso.model';
import { AuthService } from '../../service/auth.service';
import { NotificacionService } from '../../service/notificacion.service';
import { ProcesoService } from '../../service/proceso.service';
import { mensajeDeError } from '../../utils/problema';

/** HU-04 y HU-06: listado de procesos con búsqueda, filtros, paginación y eliminación lógica. */
@Component({
  selector: 'app-procesos',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CampoFormularioComponent,
    EstadoVacioComponent,
    ModalConfirmacionComponent,
    PaginadorComponent,
    SpinnerCargaComponent,
    TablaProcesosComponent
  ],
  templateUrl: './procesos.component.html'
})
/** Página de listado. Estado en signals (pagina, cargando, error...) y filtros en un FormGroup; no guarda la lista en variables sueltas. */
export class ProcesosComponent implements OnInit {
  /** Servicio HTTP de procesos (listar, eliminar...). */
  private readonly procesoService = inject(ProcesoService);
  /** Toasts de éxito/error para acciones puntuales (eliminar). */
  private readonly notificaciones = inject(NotificacionService);
  /** Público para que la plantilla consulte los roles de acceso (puedeEditar, esAdministrador) y oculte/muestre acciones. */
  readonly auth = inject(AuthService);

  /** Opciones del select de estado: se antepone "Todos" (valor vacío = sin filtro) a los estados del enum compartido. */
  readonly opcionesEstado: OpcionLista[] = [{ valor: '', etiqueta: 'Todos los estados' }, ...ESTADOS_PROCESO];
  /** Select de visibilidad: '' = solo activos (comportamiento por defecto del backend); 'false' = ver los eliminados lógicamente. */
  readonly opcionesVisibilidad: OpcionLista[] = [
    { valor: '', etiqueta: 'Procesos activos' },
    { valor: 'false', etiqueta: 'Procesos eliminados' }
  ];

  /** Formulario reactivo de búsqueda. Sin validadores: todos los filtros son opcionales. nonNullable => los campos vacíos son "" y no null. */
  readonly filtros = new FormGroup({
    nombre: new FormControl('', { nonNullable: true }),
    categoria: new FormControl('', { nonNullable: true }),
    estado: new FormControl('', { nonNullable: true }),
    visibilidad: new FormControl('', { nonNullable: true })
  });

  /** Signal con la página actual devuelta por el backend (contenido + page, totalPages, totalElements). null antes de la primera carga. */
  readonly pagina = signal<PageResponse<ProcesoResponse> | null>(null);
  /** Signal: spinner mientras hay una petición de lista en curso. */
  readonly cargando = signal(true);
  /** Signal con el mensaje de error de carga. */
  readonly error = signal('');
  /** Proceso elegido para eliminar; mientras no sea null el modal de confirmación está abierto. */
  readonly procesoAEliminar = signal<ProcesoResponse | null>(null);
  /** Signal: la baja lógica está en curso (el modal muestra "procesando"). */
  readonly eliminando = signal(false);

  /** Al abrir la página carga la primera página (índice 0, el backend pagina desde cero). */
  ngOnInit(): void {
    this.cargar(0);
  }

  /** Botón "Buscar" (ngSubmit): aplica los filtros volviendo a la primera página, porque la página anterior podría no existir con otros filtros. */
  buscar(): void {
    this.cargar(0);
  }

  /** Restablece los filtros a vacío y recarga desde la primera página. */
  limpiar(): void {
    this.filtros.reset();
    this.cargar(0);
  }

  /**
   * Pide al backend la página indicada con los filtros actuales. También la usa el paginador (evento cambiarPagina).
   * trim() quita espacios; "" se envía como filtro vacío y estado vacío/visibilidad vacía se traducen a undefined (no se manda el parámetro).
   * activo=false solo cuando se elige "Procesos eliminados".
   */
  cargar(numeroPagina: number): void {
    const f = this.filtros.getRawValue();
    this.cargando.set(true);
    this.error.set('');
    this.procesoService
      .listar({
        nombre: f.nombre.trim(),
        categoria: f.categoria.trim(),
        estado: (f.estado || undefined) as EstadoProceso | undefined,
        activo: f.visibilidad === 'false' ? false : undefined,
        pagina: numeroPagina
      })
      .subscribe({
        // Éxito: reemplaza la página mostrada y apaga el spinner.
        next: (respuesta) => {
          this.pagina.set(respuesta);
          this.cargando.set(false);
        },
        // Fallo (401 sesión vencida, 403 sin permiso, etc.): oculta el spinner y muestra el mensaje del ProblemDetail.
        error: (e: unknown) => {
          this.cargando.set(false);
          this.error.set(mensajeDeError(e));
        }
      });
  }

  /** Primer paso de eliminar: solo guarda el proceso elegido para abrir el modal de confirmación (aún no se llama al backend). */
  pedirEliminar(proceso: ProcesoResponse): void {
    this.procesoAEliminar.set(proceso);
  }

  /** Cierra el modal sin eliminar. */
  cancelarEliminar(): void {
    this.procesoAEliminar.set(null);
  }

  /**
   * Segundo paso: el usuario confirmó. Llama al backend (DELETE = baja lógica, el registro sigue en la base de datos con activo=false).
   * Estrategia pesimista: la lista solo cambia cuando el backend responde OK.
   */
  confirmarEliminar(): void {
    const proceso = this.procesoAEliminar();
    if (!proceso) {
      return;
    }
    this.eliminando.set(true);
    this.procesoService.eliminar(proceso.id).subscribe({
      next: () => {
        // La fila desaparece solo cuando el backend confirma la baja lógica.
        this.eliminando.set(false);
        this.procesoAEliminar.set(null);
        this.notificaciones.exito('El proceso "' + proceso.nombre + '" fue eliminado. Puedes verlo con el filtro de eliminados.');
        const actual = this.pagina();
        // Si la página tenía un único elemento y no es la primera, retrocede una página para no quedar en una página vacía; si no, recarga la misma.
        this.cargar(actual && actual.content.length === 1 && actual.page > 0 ? actual.page - 1 : (actual?.page ?? 0));
      },
      error: (e: unknown) => {
        this.eliminando.set(false);
        this.procesoAEliminar.set(null);
        // Fallo (403 sin permiso de administrador, 404 ya no existe, 409 conflicto...): se cierra el modal y se avisa; la lista queda intacta.
        this.notificaciones.error(mensajeDeError(e));
      }
    });
  }
}
