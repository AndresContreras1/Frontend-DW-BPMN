// =====================================================================================
// visor-proceso.component.ts
// Contenedor de SOLO LECTURA que junta tres piezas: leyenda + diagrama + detalle.
// Es el "componente inteligente" de la vista: guarda la selección en un signal y la comparte
// con sus hijos (el diagrama la emite, el detalle la recibe). Patrón: estado arriba, hijos con Input/Output.
// =====================================================================================
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
  /** Modelo del proceso que entrega el padre (página); se reparte a diagrama y detalle. */
  readonly datos = input.required<DatosDiagrama>();
  /** Elemento elegido en el diagrama (estado local del visor); empieza sin selección. */
  readonly seleccion = signal<SeleccionDiagrama | null>(null);
}
