export interface ArcoRequest {
  origenId: number;
  destinoId: number;
  etiqueta?: string;
  condicion?: string;
}

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
  poolId: number;
}
