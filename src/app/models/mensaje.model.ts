import {
  PoliticaFalloNotificacion,
  PoliticaMensajeSinCaso,
  TipoDestinoExterno
} from './enums.model';

export interface MensajeRequest {
  nombre: string;
  contenido: string;
  poolOrigenId: number;
  poolDestinoId: number;
  eventoThrowId?: number;
  eventoCatchId?: number;
  claveCorrelacion?: string;
  tipoDestinoExterno?: TipoDestinoExterno;
  destinoExterno?: string;
  politicaFalloNotificacion?: PoliticaFalloNotificacion;
  actividadErrorId?: number;
  politicaSinCaso?: PoliticaMensajeSinCaso;
}

export interface EditarMensajeRequest {
  nombre: string;
  contenido: string;
  eventoCatchId?: number;
  claveCorrelacion?: string;
  tipoDestinoExterno?: TipoDestinoExterno;
  destinoExterno?: string;
  politicaFalloNotificacion?: PoliticaFalloNotificacion;
  actividadErrorId?: number;
  politicaSinCaso?: PoliticaMensajeSinCaso;
}

export interface MensajeResponse {
  id: number;
  nombre: string;
  contenido: string;
  poolOrigenId: number;
  poolDestinoId: number;
  procesoId: number;
  eventoThrowId?: number;
  eventoCatchId?: number;
  claveCorrelacion?: string;
  tipoDestinoExterno?: TipoDestinoExterno;
  destinoExterno?: string;
  politicaFalloNotificacion?: PoliticaFalloNotificacion;
  actividadErrorId?: number;
  politicaSinCaso?: PoliticaMensajeSinCaso;
  sinReceptor: boolean;
}

export interface CorrelacionRequest {
  criterio: string;
}

export interface CorrelacionResponse {
  id: number;
  criterio: string;
  mensajeId: number;
}
