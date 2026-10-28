// Catálogos del dominio BPMN. Los "enum" de Java del backend se representan aquí como
// uniones de literales de cadena (type X = "A" | "B"): TypeScript valida los valores al
// compilar, no generan código extra y coinciden exactamente con el JSON del backend.
// Además cada tipo tiene su lista de opciones (valor + etiqueta legible) para llenar <select>.
// Tipos enumerados del backend (mismos valores que los enum de Java).
// Rol del usuario dentro de la empresa; controla qué pantallas y acciones puede usar.
export type RolAcceso = 'ADMINISTRADOR' | 'EDITOR' | 'SOLO_LECTURA';
// Ciclo de vida de un proceso: se edita en BORRADOR y se congela al PUBLICAR.
export type EstadoProceso = 'BORRADOR' | 'PUBLICADO';
// Variantes de tarea según BPMN (usuario, servicio, manual, script, regla de negocio).
export type TipoActividad = 'TAREA' | 'USUARIO' | 'SERVICIO' | 'MANUAL' | 'SCRIPT' | 'REGLA_NEGOCIO';
// Compuerta exclusiva (X), paralela (+) o inclusiva (O): define cómo se bifurca o une el flujo.
export type TipoGateway = 'EXCLUSIVO' | 'PARALELO' | 'INCLUSIVO';
// THROW envía un mensaje; CATCH_INICIO lo recibe para arrancar el proceso; CATCH_INTERMEDIO lo espera a mitad del flujo.
export type TipoEventoMensaje = 'THROW' | 'CATCH_INICIO' | 'CATCH_INTERMEDIO';
// Quién representa un pool: la propia empresa o un actor externo.
export type TipoParticipante = 'EMPRESA' | 'CLIENTE' | 'PROVEEDOR' | 'SISTEMA_EXTERNO';
// Canal por el que se notifica un mensaje a un sistema externo.
export type TipoDestinoExterno = 'CORREO' | 'SERVICIO_WEB' | 'COLA';
// Qué hace el proceso si la notificación externa falla.
export type PoliticaFalloNotificacion = 'CONTINUAR_FLUJO' | 'DERIVAR_ACTIVIDAD_ERROR' | 'FINALIZAR_PROCESO';
// Qué hacer cuando llega un mensaje y no existe un caso (instancia) al que correlacionarlo.
export type PoliticaMensajeSinCaso = 'DESCARTAR' | 'INICIAR_CASO_NUEVO';

// Opción genérica de un <select>: "valor" viaja al backend y "etiqueta" es el texto que ve el usuario.
// El genérico T extends string permite que cada lista quede tipada con su unión de literales (y no con string suelto).
export interface OpcionLista<T extends string = string> {
  valor: T;
  etiqueta: string;
}

// Listas de opciones: se declaran como const para reutilizarlas en formularios, filtros y descripciones sin repetir textos.
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

// Las etiquetas aclaran el significado BPMN (envío vs. recepción) para quien edita el diagrama.
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
