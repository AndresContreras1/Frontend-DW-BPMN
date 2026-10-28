import { ActividadResponse } from './actividad.model';
import { ArcoResponse } from './arco.model';
import { EstadoProceso } from './enums.model';
import { EventoMensajeResponse } from './evento-mensaje.model';
import { GatewayResponse } from './gateway.model';
import { LaneResponse } from './lane.model';
import { MensajeResponse } from './mensaje.model';
import { PoolResponse } from './pool.model';

export interface ProcesoRequest {
  nombre: string;
  descripcion: string;
  categoria: string;
}

export type EditarProcesoRequest = ProcesoRequest;

export interface CambiarEstadoProcesoRequest {
  estado: EstadoProceso;
}

export interface ProcesoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  estado: EstadoProceso;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface HistorialCambioResponse {
  id: number;
  fechaCambio: string;
  descripcionCambio: string;
  autorNombre: string;
}

export interface ProcesoDetalleResponse {
  proceso: ProcesoResponse;
  historial: HistorialCambioResponse[];
}

export interface ProcesoDiagramaResponse {
  proceso: ProcesoResponse;
  pools: PoolResponse[];
  lanes: LaneResponse[];
  actividades: ActividadResponse[];
  gateways: GatewayResponse[];
  eventos: EventoMensajeResponse[];
  arcos: ArcoResponse[];
  mensajes: MensajeResponse[];
}

export interface FiltrosProceso {
  nombre?: string;
  estado?: EstadoProceso;
  categoria?: string;
  activo?: boolean;
  pagina?: number;
}
