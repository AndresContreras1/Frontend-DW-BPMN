// Modelos de los pools (participantes) de un proceso BPMN. Un pool agrupa lanes y nodos.
import { TipoParticipante } from './enums.model';

// Crear un pool: cajaNegra indica que se muestra sin detalle interno (participante externo).
export interface PoolRequest {
  nombre: string;
  tipoParticipante: TipoParticipante;
  cajaNegra: boolean;
}

// Edición: cajaNegra es opcional, así no se pierde el valor actual si no se envía.
export interface EditarPoolRequest {
  nombre: string;
  tipoParticipante: TipoParticipante;
  cajaNegra?: boolean;
}

// Pool devuelto por el backend.
export interface PoolResponse {
  id: number;
  nombre: string;
  tipoParticipante: TipoParticipante;
  cajaNegra: boolean;
  // Orden en que se apilan los pools en el diagrama.
  orden: number;
  procesoId: number;
}
