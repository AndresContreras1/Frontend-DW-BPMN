// Respuesta de la consulta "¿qué pasaría si elimino este elemento?". Permite avisar al usuario
// antes de borrar (patrón de confirmación informada).
// Resultado del análisis de impacto de una eliminación.
export interface ImpactoEliminacionResponse {
  // true si conviene pedir confirmación explícita antes de borrar.
  requiereConfirmacion: boolean;
  // true si al borrar el flujo quedaría desconectado (nodos huérfanos).
  rompeContinuidad: boolean;
  // Mensajes concretos para mostrar al usuario.
  advertencias: string[];
}
