import { Component, computed, input } from '@angular/core';
import { SeleccionDiagrama } from '../../models/seleccion-diagrama.model';
import { DatosDiagrama } from '../../utils/diagrama-layout';
import { describirElemento } from '../../utils/descripcion-elemento';

/** Panel de solo lectura con las propiedades del elemento elegido en el diagrama. */
@Component({
  selector: 'app-detalle-elemento',
  templateUrl: './detalle-elemento.component.html'
})
export class DetalleElementoComponent {
  readonly datos = input.required<DatosDiagrama>();
  readonly seleccion = input<SeleccionDiagrama | null>(null);

  readonly descripcion = computed(() => describirElemento(this.datos(), this.seleccion()));
}
