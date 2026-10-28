import { TipoGateway } from './enums.model';

export interface GatewayRequest {
  nombre: string;
  tipoGateway: TipoGateway;
  posicionX: number;
  posicionY: number;
}

export interface GatewayResponse {
  id: number;
  nombre: string;
  tipoGateway: TipoGateway;
  posicionX: number;
  posicionY: number;
  laneId: number;
}
