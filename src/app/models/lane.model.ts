// Modelos de las lanes (carriles) de un pool. Cada lane representa a un rol de proceso responsable.
// Una lane se crea indicando su nombre y el rol de proceso que responde por ella.
export interface LaneRequest {
  nombre: string;
  rolProcesoId: number;
}

// Lane devuelta por el backend; incluye el nombre del rol para no consultar otra vez.
export interface LaneResponse {
  id: number;
  nombre: string;
  // Posición vertical dentro del pool (se usa para apilar los carriles al dibujar).
  orden: number;
  poolId: number;
  rolProcesoId: number;
  rolProcesoNombre: string;
}

// Para reordenar se envía la lista completa de ids en el nuevo orden deseado.
export interface ReordenarLanesRequest {
  laneIds: number[];
}
