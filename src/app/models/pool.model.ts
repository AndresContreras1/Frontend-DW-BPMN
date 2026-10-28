import { TipoParticipante } from './enums.model';

export interface PoolRequest {
  nombre: string;
  tipoParticipante: TipoParticipante;
  cajaNegra: boolean;
}

export interface EditarPoolRequest {
  nombre: string;
  tipoParticipante: TipoParticipante;
  cajaNegra?: boolean;
}

export interface PoolResponse {
  id: number;
  nombre: string;
  tipoParticipante: TipoParticipante;
  cajaNegra: boolean;
  orden: number;
  procesoId: number;
}
