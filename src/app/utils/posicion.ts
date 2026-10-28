import { DatosDiagrama } from './diagrama-layout';

const SEPARACION_X = 160;
const X_INICIAL = 80;
const Y_INICIAL = 60;

/** Posición sugerida para un nodo nuevo: a la derecha del último nodo de la lane. */
export function sugerirPosicion(datos: DatosDiagrama, laneId: number): { x: number; y: number } {
  const nodos = [...datos.actividades, ...datos.gateways, ...datos.eventos].filter((n) => n.laneId === laneId);
  if (nodos.length === 0) {
    return { x: X_INICIAL, y: Y_INICIAL };
  }
  return { x: Math.max(...nodos.map((n) => n.posicionX)) + SEPARACION_X, y: Y_INICIAL };
}
