// Componente 'global': se coloca una sola vez en el layout y pinta las notificaciones del servicio compartido.
// Componente 'global': se coloca una sola vez en el layout y pinta las notificaciones del servicio compartido.
// Componente 'global': se coloca una sola vez en el layout y pinta las notificaciones del servicio compartido.
import { Component, inject } from '@angular/core';
import { NotificacionService } from '../../service/notificacion.service';

/** Contenedor de avisos; muestra las notificaciones del servicio compartido. */
@Component({
  selector: 'app-toasts',
  templateUrl: './toasts.component.html',
  styleUrl: './toasts.component.scss'
})
export class ToastsComponent {
  /**
   * inject() obtiene el servicio singleton; así cualquier componente que llame a NotificacionService.exito()/error()
   * hace aparecer un aviso aquí. Es público porque la plantilla lee notificaciones.notificaciones() (un signal).
   */
  /**
   * inject() obtiene el servicio singleton; así cualquier componente que llame a NotificacionService.exito()/error()
   * hace aparecer un aviso aquí. Es público porque la plantilla lee notificaciones.notificaciones() (un signal).
   */
  /**
   * inject() obtiene el servicio singleton; así cualquier componente que llame a NotificacionService.exito()/error()
   * hace aparecer un aviso aquí. Es público porque la plantilla lee notificaciones.notificaciones() (un signal).
   */
  readonly notificaciones = inject(NotificacionService);
}
