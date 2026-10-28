// Modelos para compartir procesos entre empresas. La empresa propietaria invita a otra, que
// ve el proceso en modo solo lectura.
import { ProcesoDiagramaResponse } from './proceso.model';

// Se define aparte (sin rolProcesoId) para no filtrar datos internos de la empresa propietaria;
// es un subconjunto de LaneResponse apto para la empresa invitada.
/** Lane vista por la empresa invitada: sin el id del rol de proceso (dato interno de la empresa propietaria). */
export interface LaneCompartidaResponse {
  id: number;
  nombre: string;
  orden: number;
  poolId: number;
  rolProcesoNombre: string;
}

// Solo hace falta el id de la empresa a la que se comparte.
export interface CompartirProcesoRequest {
  empresaInvitadaId: number;
}

// Registro de un proceso compartido, con ambas empresas (propietaria e invitada).
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

// Omit<..., "lanes"> toma el diagrama completo pero quita las lanes originales y las reemplaza por la versión sin datos internos.
// Es composición de tipos: se reutiliza lo existente en lugar de copiar campos.
export interface ProcesoCompartidoDetalleResponse extends Omit<ProcesoDiagramaResponse, 'lanes'> {
  lanes: LaneCompartidaResponse[];
  empresaPropietaria: string;
  soloLectura: boolean;
}
