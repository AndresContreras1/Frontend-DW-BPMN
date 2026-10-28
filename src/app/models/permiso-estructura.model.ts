import { RolAcceso } from './enums.model';

export interface PermisoEstructuraRequest {
  crearPool: boolean;
  editarPool: boolean;
  eliminarPool: boolean;
  crearLane: boolean;
  editarLane: boolean;
  eliminarLane: boolean;
}

export interface PermisoEstructuraResponse extends PermisoEstructuraRequest {
  rolAcceso: RolAcceso;
}
