// Modelos de los arcos (flechas de secuencia) que conectan nodos del diagrama:
// actividades, gateways y eventos. Un arco va de un nodo origen a un nodo destino.
// Datos para crear un arco: solo origen y destino son obligatorios.
export interface ArcoRequest {
  origenId: number;
  destinoId: number;
  // Texto que se dibuja sobre la flecha (ej. "Sí" / "No").
  etiqueta?: string;
  // Expresión que decide si el flujo toma este camino; el backend la exige en gateways divergentes.
  condicion?: string;
}

// Al editar todo es opcional: se envía solo lo que cambia (reconectar origen/destino incluido).
export interface EditarArcoRequest {
  etiqueta?: string;
  condicion?: string;
  origenId?: number;
  destinoId?: number;
}

export interface ArcoResponse {
  id: number;
  etiqueta?: string;
  condicion?: string;
  origenId: number;
  destinoId: number;
  // Pool al que pertenece el arco; lo calcula el backend, el frontend solo lo lee.
  poolId: number;
}
