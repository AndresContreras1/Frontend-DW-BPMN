// Modelos de los gateways (compuertas) BPMN: puntos donde el flujo se bifurca o se une.
import { TipoGateway } from './enums.model';

// Datos para crear o editar un gateway.
export interface GatewayRequest {
  nombre: string;
  // Exclusivo, paralelo o inclusivo; determina la semántica de las salidas.
  tipoGateway: TipoGateway;
  posicionX: number;
  posicionY: number;
  /** Solo al editar: mueve el gateway a otra lane del mismo pool. */
  laneId?: number;
}

// Gateway devuelto por el backend, con su lane obligatoria.
export interface GatewayResponse {
  id: number;
  nombre: string;
  tipoGateway: TipoGateway;
  posicionX: number;
  posicionY: number;
  laneId: number;
}
