// Sugiere dónde colocar un nodo nuevo en una lane para que no quede encima de otro.
import { DatosDiagrama } from './diagrama-layout';

// Constantes de maquetación: separación horizontal entre nodos y punto de partida (coordenadas relativas a la lane).
const SEPARACION_X = 160;
const X_INICIAL = 80;
const Y_INICIAL = 60;

// Estrategia simple: la primera vez va al inicio; después, a la derecha del nodo más lejano de la lane. El usuario puede moverlo luego.
/** Posición sugerida para un nodo nuevo: a la derecha del último nodo de la lane. */
export function sugerirPosicion(datos: DatosDiagrama, laneId: number): { x: number; y: number } {
  const nodos = [...datos.actividades, ...datos.gateways, ...datos.eventos].filter((n) => n.laneId === laneId);
  if (nodos.length === 0) {
    return { x: X_INICIAL, y: Y_INICIAL };
  }
  return { x: Math.max(...nodos.map((n) => n.posicionX)) + SEPARACION_X, y: Y_INICIAL };
}
