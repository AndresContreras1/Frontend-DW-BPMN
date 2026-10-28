import { Component, inject } from '@angular/core';
import { NotificacionService } from '../../service/notificacion.service';

/** Contenedor de avisos; muestra las notificaciones del servicio compartido. */
@Component({
  selector: 'app-toasts',
  templateUrl: './toasts.component.html',
  styleUrl: './toasts.component.scss'
})
export class ToastsComponent {
  readonly notificaciones = inject(NotificacionService);
}
