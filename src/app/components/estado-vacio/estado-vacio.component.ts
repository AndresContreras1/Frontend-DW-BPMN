import { Component, input } from '@angular/core';

@Component({
  selector: 'app-estado-vacio',
  templateUrl: './estado-vacio.component.html'
})
export class EstadoVacioComponent {
  readonly mensaje = input<string>('No hay información para mostrar.');
}
