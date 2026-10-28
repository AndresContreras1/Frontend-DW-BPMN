import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProcesoResponse } from '../../models/proceso.model';

/** Tabla de procesos reutilizable; las acciones se avisan al padre con Output. */
@Component({
  selector: 'app-tabla-procesos',
  imports: [RouterLink, DatePipe],
  templateUrl: './tabla-procesos.component.html'
})
export class TablaProcesosComponent {
  readonly procesos = input.required<ProcesoResponse[]>();
  readonly puedeEditar = input<boolean>(false);
  readonly puedeEliminar = input<boolean>(false);
  readonly eliminar = output<ProcesoResponse>();
}
