// Modelos (DTOs) de las actividades (tareas) de un proceso BPMN.
// Son interfaces y no clases: solo describen la forma del JSON que viaja entre el
// frontend y el backend. En TypeScript las interfaces desaparecen al compilar (no generan
// código en tiempo de ejecución), por eso son ideales para tipar respuestas HTTP.
// Convención del proyecto: XxxRequest = lo que se envía, XxxResponse = lo que se recibe.
import { TipoActividad } from './enums.model';

// Cuerpo que se envía al backend para crear o editar una actividad.
export interface ActividadRequest {
  nombre: string;
  // El signo ? marca el campo como opcional: el backend lo acepta ausente.
  descripcion?: string;
  // Posición relativa a la lane que la contiene (no es absoluta en el lienzo).
  posicionX: number;
  posicionY: number;
  // Lane (responsable) donde vive la actividad; opcional porque al editar puede no cambiar.
  laneId?: number;
  tipoActividad?: TipoActividad;
}

// Actividad tal como la devuelve el backend: ya trae el id y los campos obligatorios completos.
export interface ActividadResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  posicionX: number;
  posicionY: number;
  laneId: number;
  tipoActividad: TipoActividad;
}
