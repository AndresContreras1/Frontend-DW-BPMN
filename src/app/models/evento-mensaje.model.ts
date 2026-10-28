// Modelos de los eventos de mensaje (throw/catch) que envían o reciben mensajes entre pools.
import { TipoEventoMensaje } from './enums.model';

// Datos para crear o editar un evento de mensaje.
export interface EventoMensajeRequest {
  nombre: string;
  tipoEvento: TipoEventoMensaje;
  // Descripción de lo que transporta el mensaje.
  contenido: string;
  // Campo que permite emparejar el mensaje recibido con el caso (instancia) correcto.
  claveCorrelacion: string;
  posicionX: number;
  posicionY: number;
  // true si el mensaje lo origina un sistema ajeno al proceso (no otro pool modelado).
  origenExterno: boolean;
  /** Solo al editar: mueve el evento a otra lane del mismo pool. */
  laneId?: number;
  /** Solo eventos CATCH: actividades que usan los datos del mensaje. */
  actividadIds?: number[];
}

// Evento tal como lo devuelve el backend (laneId siempre presente).
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
  // Opcional: solo los eventos CATCH enlazan actividades.
  actividadIds?: number[];
}
