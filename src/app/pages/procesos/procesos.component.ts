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
export class ProcesosComponent implements OnInit {
  private readonly procesoService = inject(ProcesoService);
  private readonly notificaciones = inject(NotificacionService);
  readonly auth = inject(AuthService);

  readonly opcionesEstado: OpcionLista[] = [{ valor: '', etiqueta: 'Todos los estados' }, ...ESTADOS_PROCESO];
  readonly opcionesVisibilidad: OpcionLista[] = [
    { valor: '', etiqueta: 'Procesos activos' },
    { valor: 'false', etiqueta: 'Procesos eliminados' }
  ];

  readonly filtros = new FormGroup({
    nombre: new FormControl('', { nonNullable: true }),
    categoria: new FormControl('', { nonNullable: true }),
    estado: new FormControl('', { nonNullable: true }),
    visibilidad: new FormControl('', { nonNullable: true })
  });

  readonly pagina = signal<PageResponse<ProcesoResponse> | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly procesoAEliminar = signal<ProcesoResponse | null>(null);
  readonly eliminando = signal(false);

  ngOnInit(): void {
    this.cargar(0);
  }

  buscar(): void {
    this.cargar(0);
  }

  limpiar(): void {
    this.filtros.reset();
    this.cargar(0);
  }

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
        next: (respuesta) => {
          this.pagina.set(respuesta);
          this.cargando.set(false);
        },
        error: (e: unknown) => {
          this.cargando.set(false);
          this.error.set(mensajeDeError(e));
        }
      });
  }

  pedirEliminar(proceso: ProcesoResponse): void {
    this.procesoAEliminar.set(proceso);
  }

  cancelarEliminar(): void {
    this.procesoAEliminar.set(null);
  }

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
        this.cargar(actual && actual.content.length === 1 && actual.page > 0 ? actual.page - 1 : (actual?.page ?? 0));
      },
      error: (e: unknown) => {
        this.eliminando.set(false);
        this.procesoAEliminar.set(null);
        this.notificaciones.error(mensajeDeError(e));
      }
    });
  }
}
