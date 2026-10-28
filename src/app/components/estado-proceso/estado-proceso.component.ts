// Muestra el estado del proceso y gestiona la publicación con confirmación previa (modal).
// Mezcla input()/output() con signals locales para el estado de la interfaz.
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
  // Standalone: importa el modal que usa en su plantilla.
  imports: [ModalConfirmacionComponent],
  templateUrl: './estado-proceso.component.html'
})
export class EstadoProcesoComponent {
  /** Servicio HTTP de procesos; inject() lo obtiene sin pasar por el constructor. */
  private readonly procesoService = inject(ProcesoService);
  /** Toasts para avisar el éxito. */
  private readonly notificaciones = inject(NotificacionService);

  /** Proceso a mostrar (obligatorio). */
  readonly proceso = input.required<ProcesoResponse>();
  /** Permiso del usuario; solo quien puede editar ve el botón Publicar. */
  readonly puedeEditar = input<boolean>(false);
  /** Evento al padre con el proceso ya actualizado (publicado) para que refresque su vista. */
  readonly cambiado = output<ProcesoResponse>();

  /** signal: true mientras el modal de confirmación está abierto. */
  readonly confirmando = signal(false);
  /** signal: true mientras se espera la respuesta del backend. */
  readonly procesando = signal(false);
  /** signal: texto de las incoherencias que devolvió el backend al rechazar la publicación. */
  readonly advertencia = signal('');

  /** Abre el modal de confirmación y limpia cualquier advertencia anterior. */
  pedirPublicar(): void {
    this.advertencia.set('');
    this.confirmando.set(true);
  }

  /** Cierra el modal sin hacer nada. */
  cancelar(): void {
    this.confirmando.set(false);
  }

  /** Confirmado: pide al backend pasar el proceso a PUBLICADO. El backend valida el modelo completo. */
  publicar(): void {
    this.procesando.set(true);
    this.procesoService.cambiarEstado(this.proceso().id, 'PUBLICADO').subscribe({
      // Éxito: se cierra el modal, se avisa con un toast y se emite el proceso actualizado al padre.
      next: (actualizado) => {
        this.procesando.set(false);
        this.confirmando.set(false);
        this.notificaciones.exito('El proceso quedó publicado.');
        this.cambiado.emit(actualizado);
      },
      // Rechazo (por ejemplo 409 por modelo incoherente): se cierra el modal y el detalle del backend se muestra como advertencia.
      error: (e: unknown) => {
        this.procesando.set(false);
        this.confirmando.set(false);
        this.advertencia.set(mensajeDeError(e));
      }
    });
  }
}
