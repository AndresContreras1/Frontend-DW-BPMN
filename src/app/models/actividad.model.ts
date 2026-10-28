import { TipoActividad } from './enums.model';

export interface ActividadRequest {
  nombre: string;
  descripcion?: string;
  posicionX: number;
  posicionY: number;
  laneId?: number;
  tipoActividad?: TipoActividad;
}

export interface ActividadResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  posicionX: number;
  posicionY: number;
  laneId: number;
  tipoActividad: TipoActividad;
}
