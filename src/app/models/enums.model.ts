// Tipos enumerados del backend (mismos valores que los enum de Java).
export type RolAcceso = 'ADMINISTRADOR' | 'EDITOR' | 'SOLO_LECTURA';
export type EstadoProceso = 'BORRADOR' | 'PUBLICADO';
export type TipoActividad = 'TAREA' | 'USUARIO' | 'SERVICIO' | 'MANUAL' | 'SCRIPT' | 'REGLA_NEGOCIO';
export type TipoGateway = 'EXCLUSIVO' | 'PARALELO' | 'INCLUSIVO';
export type TipoEventoMensaje = 'THROW' | 'CATCH_INICIO' | 'CATCH_INTERMEDIO';
export type TipoParticipante = 'EMPRESA' | 'CLIENTE' | 'PROVEEDOR' | 'SISTEMA_EXTERNO';
export type TipoDestinoExterno = 'CORREO' | 'SERVICIO_WEB' | 'COLA';
export type PoliticaFalloNotificacion = 'CONTINUAR_FLUJO' | 'DERIVAR_ACTIVIDAD_ERROR' | 'FINALIZAR_PROCESO';
export type PoliticaMensajeSinCaso = 'DESCARTAR' | 'INICIAR_CASO_NUEVO';

export interface OpcionLista<T extends string = string> {
  valor: T;
  etiqueta: string;
}

export const ROLES_ACCESO: OpcionLista<RolAcceso>[] = [
  { valor: 'ADMINISTRADOR', etiqueta: 'Administrador' },
  { valor: 'EDITOR', etiqueta: 'Editor' },
  { valor: 'SOLO_LECTURA', etiqueta: 'Solo lectura' }
];

export const ESTADOS_PROCESO: OpcionLista<EstadoProceso>[] = [
  { valor: 'BORRADOR', etiqueta: 'Borrador' },
  { valor: 'PUBLICADO', etiqueta: 'Publicado' }
];

export const TIPOS_ACTIVIDAD: OpcionLista<TipoActividad>[] = [
  { valor: 'TAREA', etiqueta: 'Tarea' },
  { valor: 'USUARIO', etiqueta: 'Tarea de usuario' },
  { valor: 'SERVICIO', etiqueta: 'Tarea de servicio' },
  { valor: 'MANUAL', etiqueta: 'Tarea manual' },
  { valor: 'SCRIPT', etiqueta: 'Tarea de script' },
  { valor: 'REGLA_NEGOCIO', etiqueta: 'Regla de negocio' }
];

export const TIPOS_GATEWAY: OpcionLista<TipoGateway>[] = [
  { valor: 'EXCLUSIVO', etiqueta: 'Exclusivo (X)' },
  { valor: 'PARALELO', etiqueta: 'Paralelo (+)' },
  { valor: 'INCLUSIVO', etiqueta: 'Inclusivo (O)' }
];

export const TIPOS_EVENTO_MENSAJE: OpcionLista<TipoEventoMensaje>[] = [
  { valor: 'THROW', etiqueta: 'Envío (throw)' },
  { valor: 'CATCH_INICIO', etiqueta: 'Recepción de inicio (catch)' },
  { valor: 'CATCH_INTERMEDIO', etiqueta: 'Recepción intermedia (catch)' }
];

export const TIPOS_PARTICIPANTE: OpcionLista<TipoParticipante>[] = [
  { valor: 'EMPRESA', etiqueta: 'Empresa' },
  { valor: 'CLIENTE', etiqueta: 'Cliente' },
  { valor: 'PROVEEDOR', etiqueta: 'Proveedor' },
  { valor: 'SISTEMA_EXTERNO', etiqueta: 'Sistema externo' }
];

export const TIPOS_DESTINO_EXTERNO: OpcionLista<TipoDestinoExterno>[] = [
  { valor: 'CORREO', etiqueta: 'Correo' },
  { valor: 'SERVICIO_WEB', etiqueta: 'Servicio web' },
  { valor: 'COLA', etiqueta: 'Cola' }
];

export const POLITICAS_FALLO: OpcionLista<PoliticaFalloNotificacion>[] = [
  { valor: 'CONTINUAR_FLUJO', etiqueta: 'Continuar el flujo' },
  { valor: 'DERIVAR_ACTIVIDAD_ERROR', etiqueta: 'Derivar a una actividad de error' },
  { valor: 'FINALIZAR_PROCESO', etiqueta: 'Finalizar el proceso' }
];

export const POLITICAS_SIN_CASO: OpcionLista<PoliticaMensajeSinCaso>[] = [
  { valor: 'DESCARTAR', etiqueta: 'Descartar el mensaje' },
  { valor: 'INICIAR_CASO_NUEVO', etiqueta: 'Iniciar un caso nuevo' }
];
