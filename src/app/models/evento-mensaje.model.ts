import { TipoEventoMensaje } from './enums.model';

export interface EventoMensajeRequest {
  nombre: string;
  tipoEvento: TipoEventoMensaje;
  contenido: string;
  claveCorrelacion: string;
  posicionX: number;
  posicionY: number;
  origenExterno: boolean;
  /** Solo al editar: mueve el evento a otra lane del mismo pool. */
  laneId?: number;
  /** Solo eventos CATCH: actividades que usan los datos del mensaje. */
  actividadIds?: number[];
}

export interface EventoMensajeResponse {
  id: number;
  nombre: string;
  tipoEvento: TipoEventoMensaje;
  contenido: string;
  claveCorrelacion: string;
  posicionX: number;
  posicionY: number;
  laneId: number;
  origenExterno: boolean;
  actividadIds?: number[];
}
