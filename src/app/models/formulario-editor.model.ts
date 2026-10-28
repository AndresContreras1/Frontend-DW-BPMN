// Tipo que describe QUÉ formulario está abierto en el panel lateral del editor de procesos.
// Es una unión discriminada: el campo "tipo" funciona como etiqueta y TypeScript estrecha
// (narrowing) automáticamente el resto de campos dentro de un switch/if sobre "tipo".
import { ActividadResponse } from './actividad.model';
import { ArcoResponse } from './arco.model';
import { EventoMensajeResponse } from './evento-mensaje.model';
import { GatewayResponse } from './gateway.model';
import { LaneResponse } from './lane.model';
import { MensajeResponse } from './mensaje.model';
import { PoolResponse } from './pool.model';

// Regla de uso: el elemento en null significa "crear"; con valor, "editar ese elemento".
// Una unión discriminada evita estados imposibles (ej. un formulario de pool con un arco).
/** Formulario abierto en el panel del editor (elemento null = crear, con elemento = editar). */
export type FormularioEditor =
  | { tipo: 'pool'; pool: PoolResponse | null }
  | { tipo: 'lane'; poolId: number; lane: LaneResponse | null }
  // laneId opcional: sugiere la lane donde crear el nodo cuando se origina desde una lane concreta.
  | { tipo: 'actividad'; actividad: ActividadResponse | null; laneId?: number }
  | { tipo: 'gateway'; gateway: GatewayResponse | null; laneId?: number }
  | { tipo: 'evento'; evento: EventoMensajeResponse | null; laneId?: number }
  | { tipo: 'arco'; arco: ArcoResponse | null }
  | { tipo: 'mensaje'; mensaje: MensajeResponse | null };
