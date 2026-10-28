// Modelos de los roles de proceso (responsables que se asignan a las lanes). No confundir
// con RolAcceso, que es el permiso del usuario en la aplicación.
// Crear o editar un rol de proceso.
export interface RolProcesoRequest {
  nombre: string;
  descripcion?: string;
}

// Versión para el listado: indica en cuántos procesos se usa (procesosQueLoUsan) y si está en uso.
export interface RolProcesoVistaResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  procesosQueLoUsan: number;
  // Si está en uso, la interfaz impide eliminarlo.
  enUso: boolean;
}

// Versión para la consulta detallada: lista los nombres de los procesos que lo usan.
export interface RolProcesoConsultaResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  procesos: string[];
  enUso: boolean;
}
