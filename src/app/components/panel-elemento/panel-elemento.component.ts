// =====================================================================================
// panel-elemento.component.ts
// Panel lateral del EDITOR: muestra el detalle del elemento elegido en el diagrama y los botones de acción
// (editar, eliminar, agregar lane o nodo, reordenar lanes) que el rol del usuario permite.
// Es un componente de presentación: NO llama al backend; cada acción se emite con un Output y el padre (editor)
// decide qué formulario abrir. Los permisos llegan como Input (los calcula el backend por rol).
// =====================================================================================
import { Component, computed, input, output } from '@angular/core';

import { PermisoEstructuraResponse } from '../../models/permiso-estructura.model';
import { SeleccionDiagrama } from '../../models/seleccion-diagrama.model';
import { DatosDiagrama, LaneDatos } from '../../utils/diagrama-layout';
import { CorrelacionFormComponent } from '../correlacion-form/correlacion-form.component';
import { DetalleElementoComponent } from '../detalle-elemento/detalle-elemento.component';

/** Orden deseado de las lanes de un pool: ids de arriba hacia abajo. Es lo que se emite al reordenar. */
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
  /** Modelo del diagrama (para el detalle y para listar las lanes del pool). */
  readonly datos = input.required<DatosDiagrama>();
  /** Elemento elegido en el diagrama, o null. */
  readonly seleccion = input<SeleccionDiagrama | null>(null);
  /** True si el usuario puede modificar el proceso (por ejemplo, no está publicado). */
  readonly puedeEditar = input<boolean>(false);
  /** El administrador puede eliminar cualquier elemento; los demás roles dependen de sus permisos de estructura. */
  readonly esAdministrador = input<boolean>(false);
  /** Permisos de estructura del rol sobre pools y lanes (crear/editar/eliminar); null mientras cargan. */
  readonly permisos = input<PermisoEstructuraResponse | null>(null);

  /** Outputs hacia el editor padre: cada uno representa una intención del usuario. */
  readonly editar = output<SeleccionDiagrama>();
  readonly eliminar = output<SeleccionDiagrama>();
  /** Pide crear una lane en el pool indicado (id del pool). */
  readonly nuevaLane = output<number>();
  /** Pide crear un nodo (actividad, gateway o evento) en la lane indicada. */
  readonly nuevoNodo = output<{ tipo: 'actividad' | 'gateway' | 'evento'; laneId: number }>();
  /** Pide guardar un nuevo orden de lanes. */
  readonly reordenar = output<ReordenLanes>();
  /** Pide seleccionar otro elemento (p. ej. al pulsar una lane de la lista). */
  readonly seleccionar = output<SeleccionDiagrama>();

  /**
   * ¿Se puede editar lo seleccionado? Requiere que el proceso sea editable. Para pools y lanes además
   * depende del permiso de estructura del rol; los demás elementos (actividad, gateway, evento, arco, mensaje) se pueden editar siempre que el proceso lo sea.
   */
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

  /**
   * ¿Se puede eliminar lo seleccionado? Pools y lanes según permisos del rol; el resto de elementos solo
   * los elimina el administrador.
   */
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

  /** Habilita los botones de subir/bajar lane: proceso editable y permiso de editar lanes. */
  readonly puedeEditarLanes = computed(() => this.puedeEditar() && (this.permisos()?.editarLane ?? false));

  /** Habilita "Agregar lane": proceso editable y permiso de crear lanes. */
  readonly puedeCrearLane = computed(() => this.puedeEditar() && (this.permisos()?.crearLane ?? false));

  /** Lanes del pool seleccionado ordenadas por su campo `orden` (vacío si lo seleccionado no es un pool). */
  readonly lanesDelPool = computed<LaneDatos[]>(() => {
    const sel = this.seleccion();
    if (sel?.tipo !== 'pool') {
      return [];
    }
    return this.datos().lanes.filter((l) => l.poolId === sel.id).sort((a, b) => a.orden - b.orden);
  });

  /** True si el pool seleccionado es de caja negra; esos pools no admiten lanes. */
  readonly poolEsCajaNegra = computed(() => {
    const sel = this.seleccion();
    return sel?.tipo === 'pool' && (this.datos().pools.find((p) => p.id === sel.id)?.cajaNegra ?? false);
  });

  /**
   * Sube (-1) o baja (+1) una lane intercambiándola con su vecina. Si ya está en un extremo no hace nada.
   * El intercambio usa desestructuración de arreglos; emite la lista completa de ids en el nuevo orden.
   */
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
