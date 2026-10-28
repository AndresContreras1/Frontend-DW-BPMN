import { Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner-carga',
  templateUrl: './spinner-carga.component.html'
})
export class SpinnerCargaComponent {
  readonly texto = input<string>('Cargando...');
}
