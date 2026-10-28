// Resultado de la validación del modelo BPMN hecha por el backend (reglas de negocio del diagrama).
// El frontend no valida el diagrama: solo muestra lo que decide el backend.
export interface ValidacionModeloResponse {
  // true si el modelo cumple todas las reglas.
  valido: boolean;
  // Lista de problemas encontrados, lista para mostrar al usuario.
  advertencias: string[];
}
