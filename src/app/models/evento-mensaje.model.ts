import { TipoEventoMensaje } from './enums.model';

export interface EventoMensajeRequest {
  nombre: string;
  tipoEvento: TipoEventoMensaje;
  contenido: string;
  claveCorrelacion: string;
  posicionX: number;
  posicionY: number;
  origenExterno: boolean;
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
}
