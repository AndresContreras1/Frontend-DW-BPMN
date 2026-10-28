import { LaneResponse } from '../models/lane.model';
import { ProcesoDiagramaResponse } from '../models/proceso.model';

/** Lane tal como la necesita el dibujo (la empresa invitada recibe una versión sin el id del rol). */
export type LaneDatos = Pick<LaneResponse, 'id' | 'nombre' | 'orden' | 'poolId' | 'rolProcesoNombre'>;

/** Datos del modelo necesarios para dibujar (sin el proceso). */
export type DatosDiagrama = Omit<ProcesoDiagramaResponse, 'proceso' | 'lanes'> & { lanes: LaneDatos[] };

export const ANCHO_ACTIVIDAD = 120;
export const ALTO_ACTIVIDAD = 60;
export const TAM_GATEWAY = 50;
export const TAM_EVENTO = 36;

const MARGEN = 20;
const ETIQUETA_POOL = 36;
const ETIQUETA_LANE = 32;
const ALTO_LANE_MIN = 140;
const ALTO_CAJA_NEGRA = 64;
const ALTO_POOL_VACIO = 100;
const SEPARACION_POOLS = 80;
const ANCHO_MIN = 760;

export interface Caja {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

export type TipoNodo = 'actividad' | 'gateway' | 'evento';

export interface NodoVista extends Caja {
  id: number;
  tipo: TipoNodo;
  nombre: string;
  /** Tipo de actividad, de gateway o de evento según corresponda. */
  subtipo: string;
  laneId: number;
  claveCorrelacion?: string;
  origenExterno?: boolean;
}

export interface PoolVista extends Caja {
  id: number;
  nombre: string;
  cajaNegra: boolean;
  tipoParticipante: string;
}

export interface LaneVista extends Caja {
  id: number;
  poolId: number;
  nombre: string;
}

export interface ArcoVista {
  id: number;
  d: string;
  etiquetaX: number;
  etiquetaY: number;
  etiqueta: string;
  condicion: string;
}

export interface MensajeVista {
  id: number;
  d: string;
  etiquetaX: number;
  etiquetaY: number;
  nombre: string;
  clave: string;
  destinoExterno: string;
  sinReceptor: boolean;
}

export interface DiagramaVista {
  ancho: number;
  alto: number;
  pools: PoolVista[];
  lanes: LaneVista[];
  nodos: NodoVista[];
  arcos: ArcoVista[];
  mensajes: MensajeVista[];
}

interface NodoBruto {
  id: number;
  tipo: TipoNodo;
  nombre: string;
  subtipo: string;
  laneId: number;
  posX: number;
  posY: number;
  ancho: number;
  alto: number;
  claveCorrelacion?: string;
  origenExterno?: boolean;
}

function nodosBrutos(d: DatosDiagrama): NodoBruto[] {
  return [
    ...d.actividades.map<NodoBruto>((a) => ({
      id: a.id, tipo: 'actividad', nombre: a.nombre, subtipo: a.tipoActividad, laneId: a.laneId,
      posX: a.posicionX, posY: a.posicionY, ancho: ANCHO_ACTIVIDAD, alto: ALTO_ACTIVIDAD
    })),
    ...d.gateways.map<NodoBruto>((g) => ({
      id: g.id, tipo: 'gateway', nombre: g.nombre, subtipo: g.tipoGateway, laneId: g.laneId,
      posX: g.posicionX, posY: g.posicionY, ancho: TAM_GATEWAY, alto: TAM_GATEWAY
    })),
    ...d.eventos.map<NodoBruto>((e) => ({
      id: e.id, tipo: 'evento', nombre: e.nombre, subtipo: e.tipoEvento, laneId: e.laneId,
      posX: e.posicionX, posY: e.posicionY, ancho: TAM_EVENTO, alto: TAM_EVENTO,
      claveCorrelacion: e.claveCorrelacion, origenExterno: e.origenExterno
    }))
  ];
}

/** Divide un texto en líneas de como máximo `max` caracteres (para el texto dentro de las formas SVG). */
export function partirTexto(texto: string, max: number, maxLineas = 3): string[] {
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of texto.split(/\s+/).filter((p) => p.length > 0)) {
    const candidata = actual ? actual + ' ' + palabra : palabra;
    if (candidata.length > max && actual) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = candidata;
    }
  }
  if (actual) {
    lineas.push(actual);
  }
  if (lineas.length > maxLineas) {
    const recortadas = lineas.slice(0, maxLineas);
    recortadas[maxLineas - 1] = recortadas[maxLineas - 1].slice(0, Math.max(1, max - 1)) + '…';
    return recortadas;
  }
  return lineas;
}

function centroX(c: Caja): number {
  return c.x + c.ancho / 2;
}

function centroY(c: Caja): number {
  return c.y + c.alto / 2;
}

/** Línea de un arco: sale por el lado derecho y entra por el izquierdo; si el destino no está a la derecha, usa lados verticales. */
function trazarArco(origen: Caja, destino: Caja): { d: string; x: number; y: number } {
  const oy = centroY(origen);
  const dy = centroY(destino);
  if (destino.x >= origen.x + origen.ancho) {
    const sx = origen.x + origen.ancho;
    const ex = destino.x;
    if (Math.abs(oy - dy) < 1) {
      return { d: 'M ' + sx + ' ' + oy + ' H ' + ex, x: (sx + ex) / 2, y: oy - 6 };
    }
    const medio = (sx + ex) / 2;
    return { d: 'M ' + sx + ' ' + oy + ' H ' + medio + ' V ' + dy + ' H ' + ex, x: medio, y: (oy + dy) / 2 - 6 };
  }
  const ox = centroX(origen);
  const dx = centroX(destino);
  const hacia = destino.y >= origen.y ? 1 : -1;
  const sy = hacia === 1 ? origen.y + origen.alto : origen.y;
  const ey = hacia === 1 ? destino.y : destino.y + destino.alto;
  const medio = (sy + ey) / 2;
  return { d: 'M ' + ox + ' ' + sy + ' V ' + medio + ' H ' + dx + ' V ' + ey, x: (ox + dx) / 2, y: medio - 6 };
}

/** Línea de un mensaje entre pools: baja o sube por el espacio entre ellos. */
function trazarMensaje(origen: Caja, destino: Caja, xOrigen: number, xDestino: number): { d: string; x: number; y: number } {
  const abajo = destino.y >= origen.y;
  const y1 = abajo ? origen.y + origen.alto : origen.y;
  const y2 = abajo ? destino.y : destino.y + destino.alto;
  if (xOrigen === xDestino) {
    return { d: 'M ' + xOrigen + ' ' + y1 + ' V ' + y2, x: xOrigen, y: (y1 + y2) / 2 };
  }
  const medio = (y1 + y2) / 2;
  return {
    d: 'M ' + xOrigen + ' ' + y1 + ' V ' + medio + ' H ' + xDestino + ' V ' + y2,
    x: (xOrigen + xDestino) / 2,
    y: medio - 6
  };
}

/** Convierte el modelo (posiciones relativas a cada lane) en coordenadas absolutas listas para dibujar en SVG. */
export function calcularDiagrama(d: DatosDiagrama): DiagramaVista {
  const brutos = nodosBrutos(d);
  const anchoContenido = Math.max(ANCHO_MIN, ...brutos.map((n) => n.posX + n.ancho + 60));
  const anchoPool = ETIQUETA_POOL + ETIQUETA_LANE + anchoContenido;

  const pools: PoolVista[] = [];
  const lanes: LaneVista[] = [];
  const nodos: NodoVista[] = [];
  let cursorY = MARGEN;

  for (const pool of [...d.pools].sort((a, b) => a.orden - b.orden)) {
    const lanesPool = d.lanes.filter((l) => l.poolId === pool.id).sort((a, b) => a.orden - b.orden);
    let altoPool: number;
    if (pool.cajaNegra) {
      altoPool = ALTO_CAJA_NEGRA;
    } else if (lanesPool.length === 0) {
      altoPool = ALTO_POOL_VACIO;
    } else {
      altoPool = 0;
      for (const lane of lanesPool) {
        const delLane = brutos.filter((n) => n.laneId === lane.id);
        const altoLane = Math.max(ALTO_LANE_MIN, ...delLane.map((n) => n.posY + n.alto + 30));
        lanes.push({ id: lane.id, poolId: pool.id, nombre: lane.rolProcesoNombre || lane.nombre, x: MARGEN + ETIQUETA_POOL, y: cursorY + altoPool, ancho: anchoPool - ETIQUETA_POOL, alto: altoLane });
        for (const n of delLane) {
          nodos.push({
            id: n.id, tipo: n.tipo, nombre: n.nombre, subtipo: n.subtipo, laneId: n.laneId,
            x: MARGEN + ETIQUETA_POOL + ETIQUETA_LANE + n.posX, y: cursorY + altoPool + n.posY, ancho: n.ancho, alto: n.alto,
            claveCorrelacion: n.claveCorrelacion, origenExterno: n.origenExterno
          });
        }
        altoPool += altoLane;
      }
    }
    pools.push({ id: pool.id, nombre: pool.nombre, cajaNegra: pool.cajaNegra, tipoParticipante: pool.tipoParticipante, x: MARGEN, y: cursorY, ancho: anchoPool, alto: altoPool });
    cursorY += altoPool + SEPARACION_POOLS;
  }

  const porId = new Map<number, NodoVista>(nodos.map((n) => [n.id, n]));
  const poolPorId = new Map<number, PoolVista>(pools.map((p) => [p.id, p]));

  const arcos: ArcoVista[] = [];
  for (const arco of d.arcos) {
    const origen = porId.get(arco.origenId);
    const destino = porId.get(arco.destinoId);
    if (origen && destino) {
      const t = trazarArco(origen, destino);
      arcos.push({ id: arco.id, d: t.d, etiquetaX: t.x, etiquetaY: t.y, etiqueta: arco.etiqueta ?? '', condicion: arco.condicion ?? '' });
    }
  }

  const mensajes: MensajeVista[] = [];
  const sinEvento = new Map<number, number>();
  for (const m of d.mensajes) {
    const poolO = poolPorId.get(m.poolOrigenId);
    const poolD = poolPorId.get(m.poolDestinoId);
    if (!poolO || !poolD) {
      continue;
    }
    const emisor = m.eventoThrowId === undefined ? undefined : porId.get(m.eventoThrowId);
    const receptor = m.eventoCatchId === undefined ? undefined : porId.get(m.eventoCatchId);
    const indice = sinEvento.get(poolO.id) ?? 0;
    const origenCaja: Caja = emisor ?? poolO;
    const destinoCaja: Caja = receptor ?? poolD;
    const xOrigen = emisor ? centroX(emisor) : poolO.x + poolO.ancho / 2 + indice * 60;
    const xDestino = receptor ? centroX(receptor) : Math.min(Math.max(xOrigen, poolD.x + 20), poolD.x + poolD.ancho - 20);
    if (!emisor) {
      sinEvento.set(poolO.id, indice + 1);
    }
    const t = trazarMensaje(origenCaja, destinoCaja, xOrigen, xDestino);
    mensajes.push({
      id: m.id, d: t.d, etiquetaX: t.x, etiquetaY: t.y, nombre: m.nombre,
      clave: m.claveCorrelacion ?? '', destinoExterno: m.destinoExterno ?? '', sinReceptor: m.sinReceptor
    });
  }

  return {
    ancho: anchoPool + MARGEN * 2,
    alto: Math.max(cursorY - SEPARACION_POOLS + MARGEN, 160),
    pools, lanes, nodos, arcos, mensajes
  };
}
