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
export class RolesComponent implements OnInit {
  private readonly rolService = inject(RolProcesoService);
  private readonly notificaciones = inject(NotificacionService);

  readonly busqueda = new FormControl('', { nonNullable: true });
  readonly pagina = signal<PageResponse<RolProcesoConsultaResponse> | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');

  readonly formularioAbierto = signal(false);
  readonly rolEnEdicion = signal<RolProcesoConsultaResponse | null>(null);
  readonly enviando = signal(false);
  readonly erroresForm = signal<Record<string, string | undefined>>({});

  readonly rolAEliminar = signal<RolProcesoConsultaResponse | null>(null);
  readonly eliminando = signal(false);

  ngOnInit(): void {
    this.cargar(0);
  }

  buscar(): void {
    this.cargar(0);
  }

  cargar(numeroPagina: number): void {
    this.cargando.set(true);
    this.error.set('');
    this.rolService.buscar(this.busqueda.value.trim(), numeroPagina).subscribe({
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

  nuevo(): void {
    this.rolEnEdicion.set(null);
    this.erroresForm.set({});
    this.formularioAbierto.set(true);
  }

  editar(rol: RolProcesoConsultaResponse): void {
    this.rolEnEdicion.set(rol);
    this.erroresForm.set({});
    this.formularioAbierto.set(true);
  }

  cerrarFormulario(): void {
    this.formularioAbierto.set(false);
    this.rolEnEdicion.set(null);
  }

  guardar(datos: RolProcesoRequest): void {
    const rol = this.rolEnEdicion();
    this.enviando.set(true);
    this.erroresForm.set({});
    const peticion = rol ? this.rolService.editar(rol.id, datos) : this.rolService.crear(datos);
    peticion.subscribe({
      next: (guardado) => {
        this.enviando.set(false);
        this.notificaciones.exito('Rol de proceso "' + guardado.nombre + '" ' + (rol ? 'actualizado.' : 'creado.'));
        this.cerrarFormulario();
        this.cargar(this.pagina()?.page ?? 0);
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        this.erroresForm.set(erroresPorCampo(e));
        this.notificaciones.error(mensajeDeError(e));
      }
    });
  }

  pedirEliminar(rol: RolProcesoConsultaResponse): void {
    this.rolAEliminar.set(rol);
  }

  cancelarEliminar(): void {
    this.rolAEliminar.set(null);
  }

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
        this.cargar(actual && actual.content.length === 1 && actual.page > 0 ? actual.page - 1 : (actual?.page ?? 0));
      },
      error: (e: unknown) => {
        this.eliminando.set(false);
        this.rolAEliminar.set(null);
        this.notificaciones.error(mensajeDeError(e));
      }
    });
  }
}
