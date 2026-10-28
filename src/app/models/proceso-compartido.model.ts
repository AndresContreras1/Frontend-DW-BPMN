import { ProcesoDiagramaResponse } from './proceso.model';

/** Lane vista por la empresa invitada: sin el id del rol de proceso (dato interno de la empresa propietaria). */
export interface LaneCompartidaResponse {
  id: number;
  nombre: string;
  orden: number;
  poolId: number;
  rolProcesoNombre: string;
}

export interface CompartirProcesoRequest {
  empresaInvitadaId: number;
}

export interface ProcesoCompartidoResponse {
  id: number;
  procesoId: number;
  procesoNombre: string;
  empresaPropietariaId: number;
  empresaPropietaria: string;
  empresaInvitadaId: number;
  empresaInvitada: string;
  soloLectura: boolean;
}

export interface ProcesoCompartidoDetalleResponse extends Omit<ProcesoDiagramaResponse, 'lanes'> {
  lanes: LaneCompartidaResponse[];
  empresaPropietaria: string;
  soloLectura: boolean;
}
