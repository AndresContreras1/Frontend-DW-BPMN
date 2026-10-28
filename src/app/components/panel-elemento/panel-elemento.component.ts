import { Component, computed, input, output } from '@angular/core';

import { PermisoEstructuraResponse } from '../../models/permiso-estructura.model';
import { SeleccionDiagrama } from '../../models/seleccion-diagrama.model';
import { DatosDiagrama, LaneDatos } from '../../utils/diagrama-layout';
import { CorrelacionFormComponent } from '../correlacion-form/correlacion-form.component';
import { DetalleElementoComponent } from '../detalle-elemento/detalle-elemento.component';

export interface ReordenLanes {
  poolId: number;
  laneIds: number[];
}

/** Panel del editor: detalle del elemento elegido y las acciones que su rol permite. */
@Component({
  selector: 'app-panel-elemento',
  imports: [DetalleElementoComponent, CorrelacionFormComponent],
  templateUrl: './panel-elemento.component.html'
})
export class PanelElementoComponent {
  readonly datos = input.required<DatosDiagrama>();
  readonly seleccion = input<SeleccionDiagrama | null>(null);
  readonly puedeEditar = input<boolean>(false);
  /** El administrador puede eliminar cualquier elemento; los demás roles dependen de sus permisos de estructura. */
  readonly esAdministrador = input<boolean>(false);
  readonly permisos = input<PermisoEstructuraResponse | null>(null);

  readonly editar = output<SeleccionDiagrama>();
  readonly eliminar = output<SeleccionDiagrama>();
  readonly nuevaLane = output<number>();
  readonly nuevoNodo = output<{ tipo: 'actividad' | 'gateway' | 'evento'; laneId: number }>();
  readonly reordenar = output<ReordenLanes>();
  readonly seleccionar = output<SeleccionDiagrama>();

  readonly puedeEditarSeleccion = computed(() => {
    const sel = this.seleccion();
    if (!sel || !this.puedeEditar()) {
      return false;
    }
    const p = this.permisos();
    if (sel.tipo === 'pool') {
      return p?.editarPool ?? false;
    }
    return sel.tipo === 'lane' ? (p?.editarLane ?? false) : true;
  });

  readonly puedeEliminarSeleccion = computed(() => {
    const sel = this.seleccion();
    if (!sel) {
      return false;
    }
    const p = this.permisos();
    if (sel.tipo === 'pool') {
      return p?.eliminarPool ?? false;
    }
    return sel.tipo === 'lane' ? (p?.eliminarLane ?? false) : this.esAdministrador();
  });

  readonly puedeEditarLanes = computed(() => this.puedeEditar() && (this.permisos()?.editarLane ?? false));

  readonly puedeCrearLane = computed(() => this.puedeEditar() && (this.permisos()?.crearLane ?? false));

  readonly lanesDelPool = computed<LaneDatos[]>(() => {
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

  mover(lane: LaneDatos, direccion: -1 | 1): void {
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
