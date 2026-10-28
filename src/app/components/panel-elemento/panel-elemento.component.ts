import { Component, computed, input, output } from '@angular/core';
import { LaneResponse } from '../../models/lane.model';
import { SeleccionDiagrama } from '../../models/seleccion-diagrama.model';
import { DatosDiagrama } from '../../utils/diagrama-layout';
import { DetalleElementoComponent } from '../detalle-elemento/detalle-elemento.component';

export interface ReordenLanes {
  poolId: number;
  laneIds: number[];
}

/** Panel del editor: detalle del elemento elegido y las acciones que su rol permite. */
@Component({
  selector: 'app-panel-elemento',
  imports: [DetalleElementoComponent],
  templateUrl: './panel-elemento.component.html'
})
export class PanelElementoComponent {
  readonly datos = input.required<DatosDiagrama>();
  readonly seleccion = input<SeleccionDiagrama | null>(null);
  readonly puedeEditar = input<boolean>(false);
  readonly puedeEliminar = input<boolean>(false);

  readonly editar = output<SeleccionDiagrama>();
  readonly eliminar = output<SeleccionDiagrama>();
  readonly nuevaLane = output<number>();
  readonly nuevoNodo = output<{ tipo: 'actividad' | 'gateway' | 'evento'; laneId: number }>();
  readonly reordenar = output<ReordenLanes>();
  readonly seleccionar = output<SeleccionDiagrama>();

  readonly lanesDelPool = computed<LaneResponse[]>(() => {
    const sel = this.seleccion();
    if (sel?.tipo !== 'pool') {
      return [];
    }
    return this.datos().lanes.filter((l) => l.poolId === sel.id).sort((a, b) => a.orden - b.orden);
  });

  readonly poolEsCajaNegra = computed(() => {
    const sel = this.seleccion();
    return sel?.tipo === 'pool' && (this.datos().pools.find((p) => p.id === sel.id)?.cajaNegra ?? false);
  });

  mover(lane: LaneResponse, direccion: -1 | 1): void {
    const ids = this.lanesDelPool().map((l) => l.id);
    const indice = ids.indexOf(lane.id);
    const destino = indice + direccion;
    if (destino < 0 || destino >= ids.length) {
      return;
    }
    [ids[indice], ids[destino]] = [ids[destino], ids[indice]];
    this.reordenar.emit({ poolId: lane.poolId, laneIds: ids });
  }
}
