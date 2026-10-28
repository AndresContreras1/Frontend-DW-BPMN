// Componente de presentación: recibe la lista por input() y avisa la acción de eliminar por output(); el padre hace la petición.
import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProcesoResponse } from '../../models/proceso.model';

/** Tabla de procesos reutilizable; las acciones se avisan al padre con Output. */
@Component({
  selector: 'app-tabla-procesos',
  // RouterLink para los enlaces internos; DatePipe para el pipe 'date' de la plantilla.
  imports: [RouterLink, DatePipe],
  templateUrl: './tabla-procesos.component.html'
})
export class TablaProcesosComponent {
  /** Procesos a listar (obligatorio). */
  readonly procesos = input.required<ProcesoResponse[]>();
  /** Si el usuario puede editar (permiso calculado por el padre); controla el botón Editar. */
  readonly puedeEditar = input<boolean>(false);
  /** Si el usuario puede eliminar; controla el botón Eliminar. */
  readonly puedeEliminar = input<boolean>(false);
  /** Evento al padre con el proceso a eliminar (el padre abre la confirmación). */
  readonly eliminar = output<ProcesoResponse>();
}
