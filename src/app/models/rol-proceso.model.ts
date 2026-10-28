export interface RolProcesoRequest {
  nombre: string;
  descripcion?: string;
}

export interface RolProcesoVistaResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  procesosQueLoUsan: number;
  enUso: boolean;
}

export interface RolProcesoConsultaResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  procesos: string[];
  enUso: boolean;
}
