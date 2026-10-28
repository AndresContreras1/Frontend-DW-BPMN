import { Component, inject, input, output, signal } from '@angular/core';
import { ProcesoResponse } from '../../models/proceso.model';
import { NotificacionService } from '../../service/notificacion.service';
import { ProcesoService } from '../../service/proceso.service';
import { mensajeDeError } from '../../utils/problema';
import { ModalConfirmacionComponent } from '../modal-confirmacion/modal-confirmacion.component';

/**
 * Estado del proceso (borrador / publicado). Publicar valida el modelo en el backend:
 * si hay incoherencias responde con un error y aquí se muestran como advertencias.
 */
@Component({
  selector: 'app-estado-proceso',
  imports: [ModalConfirmacionComponent],
  templateUrl: './estado-proceso.component.html'
})
export class EstadoProcesoComponent {
  private readonly procesoService = inject(ProcesoService);
  private readonly notificaciones = inject(NotificacionService);

  readonly proceso = input.required<ProcesoResponse>();
  readonly puedeEditar = input<boolean>(false);
  readonly cambiado = output<ProcesoResponse>();

  readonly confirmando = signal(false);
  readonly procesando = signal(false);
  readonly advertencia = signal('');

  pedirPublicar(): void {
    this.advertencia.set('');
    this.confirmando.set(true);
  }

  cancelar(): void {
    this.confirmando.set(false);
  }

  publicar(): void {
    this.procesando.set(true);
    this.procesoService.cambiarEstado(this.proceso().id, 'PUBLICADO').subscribe({
      next: (actualizado) => {
        this.procesando.set(false);
        this.confirmando.set(false);
        this.notificaciones.exito('El proceso quedó publicado.');
        this.cambiado.emit(actualizado);
      },
      error: (e: unknown) => {
        this.procesando.set(false);
        this.confirmando.set(false);
        this.advertencia.set(mensajeDeError(e));
      }
    });
  }
}
