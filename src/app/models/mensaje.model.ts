// Modelos de los mensajes entre pools (flujo de mensaje BPMN): comunican dos participantes
// y pueden notificar a un destino externo con políticas de fallo.
import {
  PoliticaFalloNotificacion,
  PoliticaMensajeSinCaso,
  TipoDestinoExterno
} from './enums.model';

// Crear un mensaje: exige los pools de origen y destino; los eventos throw/catch son opcionales (se puede enlazar al borde del pool).
export interface MensajeRequest {
  nombre: string;
  contenido: string;
  // Los ids de pool se fijan al crear y no se pueden cambiar al editar (ver EditarMensajeRequest).
  poolOrigenId: number;
  poolDestinoId: number;
  eventoThrowId?: number;
  eventoCatchId?: number;
  claveCorrelacion?: string;
  tipoDestinoExterno?: TipoDestinoExterno;
  destinoExterno?: string;
  // Qué hacer si falla la notificación externa; si es DERIVAR_ACTIVIDAD_ERROR se usa actividadErrorId.
  politicaFalloNotificacion?: PoliticaFalloNotificacion;
  actividadErrorId?: number;
  politicaSinCaso?: PoliticaMensajeSinCaso;
}

// Edición: no incluye pools ni evento throw porque forman la identidad del mensaje.
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

// Mensaje devuelto por el backend.
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
  // true si el mensaje no tiene evento catch que lo reciba; el diagrama lo pinta en rojo de alerta.
  sinReceptor: boolean;
}

// Criterio con el que se correlaciona un mensaje con su caso.
export interface CorrelacionRequest {
  criterio: string;
}

// Correlación guardada y ligada a un mensaje.
export interface CorrelacionResponse {
  id: number;
  criterio: string;
  mensajeId: number;
}
