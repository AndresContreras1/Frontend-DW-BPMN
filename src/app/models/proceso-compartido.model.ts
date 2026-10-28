import { ProcesoDiagramaResponse } from './proceso.model';

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

export interface ProcesoCompartidoDetalleResponse extends ProcesoDiagramaResponse {
  empresaPropietaria: string;
  soloLectura: boolean;
}
