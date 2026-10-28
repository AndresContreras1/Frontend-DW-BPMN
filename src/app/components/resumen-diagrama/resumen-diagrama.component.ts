import { Component, computed, input } from '@angular/core';
import { DatosDiagrama } from '../../utils/diagrama-layout';

/** Resumen numérico del modelo (cuántos pools, lanes, actividades, etc. tiene el proceso). */
@Component({
  selector: 'app-resumen-diagrama',
  templateUrl: './resumen-diagrama.component.html'
})
export class ResumenDiagramaComponent {
  readonly diagrama = input.required<DatosDiagrama>();

  readonly elementos = computed(() => {
    const d = this.diagrama();
    return [
      { etiqueta: 'Pools', cantidad: d.pools.length },
      { etiqueta: 'Lanes', cantidad: d.lanes.length },
      { etiqueta: 'Actividades', cantidad: d.actividades.length },
      { etiqueta: 'Gateways', cantidad: d.gateways.length },
      { etiqueta: 'Eventos de mensaje', cantidad: d.eventos.length },
      { etiqueta: 'Arcos', cantidad: d.arcos.length },
      { etiqueta: 'Mensajes', cantidad: d.mensajes.length }
    ];
  });
}
