import { TipoGateway } from './enums.model';

export interface GatewayRequest {
  nombre: string;
  tipoGateway: TipoGateway;
  posicionX: number;
  posicionY: number;
  /** Solo al editar: mueve el gateway a otra lane del mismo pool. */
  laneId?: number;
}

export interface GatewayResponse {
  id: number;
  nombre: string;
  tipoGateway: TipoGateway;
  posicionX: number;
  posicionY: number;
  laneId: number;
}
