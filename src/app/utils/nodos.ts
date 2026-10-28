// Lista unificada de nodos (actividades, gateways y eventos) con su pool, para llenar los
// selectores de origen/destino de arcos y mensajes.
import { DatosDiagrama } from './diagrama-layout';

// Opción de selector: "etiqueta" combina el tipo y el nombre para distinguir nodos homónimos.
export interface NodoOpcion {
  id: number;
  nombre: string;
  tipo: 'actividad' | 'gateway' | 'evento';
  laneId: number;
  poolId: number;
  etiqueta: string;
}

// Texto que antecede al nombre en la etiqueta del selector.
const PREFIJOS = { actividad: 'Actividad', gateway: 'Gateway', evento: 'Evento' };

// Un nodo no guarda su pool; se deduce a través de su lane (mapa laneId -> poolId). Si la lane no existe se usa 0 como respaldo.
/** Todos los nodos del modelo con su pool, para llenar los selectores de arcos y mensajes. */
export function listarNodos(datos: DatosDiagrama): NodoOpcion[] {
  const poolDeLane = new Map(datos.lanes.map((l) => [l.id, l.poolId]));
  const crear = (tipo: NodoOpcion['tipo'], id: number, nombre: string, laneId: number): NodoOpcion => ({
    id, nombre, tipo, laneId, poolId: poolDeLane.get(laneId) ?? 0, etiqueta: PREFIJOS[tipo] + ': ' + nombre
  });
  return [
    ...datos.actividades.map((a) => crear('actividad', a.id, a.nombre, a.laneId)),
    ...datos.gateways.map((g) => crear('gateway', g.id, g.nombre, g.laneId)),
    ...datos.eventos.map((e) => crear('evento', e.id, e.nombre, e.laneId))
  ];
}
