import { ActividadResponse } from './actividad.model';
import { ArcoResponse } from './arco.model';
import { EventoMensajeResponse } from './evento-mensaje.model';
import { GatewayResponse } from './gateway.model';
import { LaneResponse } from './lane.model';
import { MensajeResponse } from './mensaje.model';
import { PoolResponse } from './pool.model';

/** Formulario abierto en el panel del editor (elemento null = crear, con elemento = editar). */
export type FormularioEditor =
  | { tipo: 'pool'; pool: PoolResponse | null }
  | { tipo: 'lane'; poolId: number; lane: LaneResponse | null }
  | { tipo: 'actividad'; actividad: ActividadResponse | null; laneId?: number }
  | { tipo: 'gateway'; gateway: GatewayResponse | null; laneId?: number }
  | { tipo: 'evento'; evento: EventoMensajeResponse | null; laneId?: number }
  | { tipo: 'arco'; arco: ArcoResponse | null }
  | { tipo: 'mensaje'; mensaje: MensajeResponse | null };
