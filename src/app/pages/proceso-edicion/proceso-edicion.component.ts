import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EstadoProcesoComponent } from '../../components/estado-proceso/estado-proceso.component';
import { ProcesoFormComponent } from '../../components/proceso-form/proceso-form.component';
import { SpinnerCargaComponent } from '../../components/spinner-carga/spinner-carga.component';
import { ProcesoRequest, ProcesoResponse } from '../../models/proceso.model';
import { NotificacionService } from '../../service/notificacion.service';
import { ProcesoService } from '../../service/proceso.service';
import { erroresPorCampo, mensajeDeError } from '../../utils/problema';

/** HU-04 y HU-05: crear (procesos/nuevo) y editar (procesos/:id/editar) con el mismo formulario. */
@Component({
  selector: 'app-proceso-edicion',
  imports: [RouterLink, ProcesoFormComponent, EstadoProcesoComponent, SpinnerCargaComponent],
  templateUrl: './proceso-edicion.component.html'
})
export class ProcesoEdicionComponent implements OnInit {
  private readonly procesoService = inject(ProcesoService);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);
  private readonly params = inject(ActivatedRoute).snapshot.params;

  readonly id: number | null = this.params['id'] === undefined ? null : Number(this.params['id']);
  readonly proceso = signal<ProcesoResponse | null>(null);
  readonly cargando = signal(this.id !== null);
  readonly enviando = signal(false);
  readonly error = signal('');
  readonly errores = signal<Record<string, string | undefined>>({});

  ngOnInit(): void {
    if (this.id === null) {
      return;
    }
    this.procesoService.obtener(this.id).subscribe({
      next: (detalle) => {
        this.proceso.set(detalle.proceso);
        this.cargando.set(false);
      },
      error: (e: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(e));
      }
    });
  }

  guardar(datos: ProcesoRequest): void {
    this.enviando.set(true);
    this.error.set('');
    this.errores.set({});
    const peticion = this.id === null ? this.procesoService.crear(datos) : this.procesoService.editar(this.id, datos);
    peticion.subscribe({
      next: (guardado) => {
        this.enviando.set(false);
        this.notificaciones.exito(this.id === null ? 'Proceso creado.' : 'Cambios guardados.');
        void this.router.navigate(['/procesos', guardado.id]);
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        this.errores.set(erroresPorCampo(e));
        this.error.set(mensajeDeError(e));
      }
    });
  }

  cancelar(): void {
    void this.router.navigate(this.id === null ? ['/procesos'] : ['/procesos', this.id]);
  }

  alCambiarEstado(actualizado: ProcesoResponse): void {
    this.proceso.set(actualizado);
  }
}
