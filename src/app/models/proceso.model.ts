// Modelos del proceso BPMN: datos básicos, historial de cambios y el diagrama completo
// (proceso + todos sus elementos) que consume el editor.
import { ActividadResponse } from './actividad.model';
import { ArcoResponse } from './arco.model';
import { EstadoProceso } from './enums.model';
import { EventoMensajeResponse } from './evento-mensaje.model';
import { GatewayResponse } from './gateway.model';
import { LaneResponse } from './lane.model';
import { MensajeResponse } from './mensaje.model';
import { PoolResponse } from './pool.model';

// Datos de formulario para crear un proceso.
export interface ProcesoRequest {
  nombre: string;
  descripcion: string;
  categoria: string;
}

// Alias de tipo: editar usa exactamente los mismos campos que crear.
export type EditarProcesoRequest = ProcesoRequest;

// Para publicar o volver a borrador se envía solo el nuevo estado.
export interface CambiarEstadoProcesoRequest {
  estado: EstadoProceso;
}

// Proceso listo para mostrar; las fechas llegan como texto ISO.
export interface ProcesoResponse {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  estado: EstadoProceso;
  // Borrado lógico: un proceso inactivo no se elimina de la base de datos.
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}

// Una entrada de auditoría: quién cambió qué y cuándo.
export interface HistorialCambioResponse {
  id: number;
  fechaCambio: string;
  descripcionCambio: string;
  autorNombre: string;
}

// Detalle: el proceso más su historial.
export interface ProcesoDetalleResponse {
  proceso: ProcesoResponse;
  historial: HistorialCambioResponse[];
}

// Foto completa del modelo en una sola petición: el editor dibuja a partir de ella.
export interface ProcesoDiagramaResponse {
  proceso: ProcesoResponse;
  pools: PoolResponse[];
  lanes: LaneResponse[];
  actividades: ActividadResponse[];
  gateways: GatewayResponse[];
  eventos: EventoMensajeResponse[];
  arcos: ArcoResponse[];
  mensajes: MensajeResponse[];
}

// Filtros de la lista de procesos; todos opcionales y combinables. "pagina" alimenta la paginación.
export interface FiltrosProceso {
  nombre?: string;
  estado?: EstadoProceso;
  categoria?: string;
  activo?: boolean;
  pagina?: number;
}
