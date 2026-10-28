import { Component, input, signal } from '@angular/core';
import { SeleccionDiagrama } from '../../models/seleccion-diagrama.model';
import { DatosDiagrama } from '../../utils/diagrama-layout';
import { DetalleElementoComponent } from '../detalle-elemento/detalle-elemento.component';
import { DiagramaComponent } from '../diagrama/diagrama.component';
import { LeyendaDiagramaComponent } from '../leyenda-diagrama/leyenda-diagrama.component';

/** Visor de solo lectura: diagrama + leyenda + detalle del elemento elegido. */
@Component({
  selector: 'app-visor-proceso',
  imports: [DiagramaComponent, DetalleElementoComponent, LeyendaDiagramaComponent],
  templateUrl: './visor-proceso.component.html'
})
export class VisorProcesoComponent {
  readonly datos = input.required<DatosDiagrama>();
  readonly seleccion = signal<SeleccionDiagrama | null>(null);
}
