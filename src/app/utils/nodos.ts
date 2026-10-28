import { DatosDiagrama } from './diagrama-layout';

export interface NodoOpcion {
  id: number;
  nombre: string;
  tipo: 'actividad' | 'gateway' | 'evento';
  laneId: number;
  poolId: number;
  etiqueta: string;
}

const PREFIJOS = { actividad: 'Actividad', gateway: 'Gateway', evento: 'Evento' };

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
