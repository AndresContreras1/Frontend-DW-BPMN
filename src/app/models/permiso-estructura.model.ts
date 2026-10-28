// Permisos de estructura: qué rol puede crear/editar/eliminar pools y lanes del diagrama.
// El administrador los configura en la pantalla de permisos.
import { RolAcceso } from './enums.model';

// Seis banderas (acción x tipo de estructura) que se envían al guardar.
export interface PermisoEstructuraRequest {
  crearPool: boolean;
  editarPool: boolean;
  eliminarPool: boolean;
  crearLane: boolean;
  editarLane: boolean;
  eliminarLane: boolean;
}

// extends reutiliza la interfaz del request y solo agrega a qué rol pertenece, evitando repetir los seis campos.
export interface PermisoEstructuraResponse extends PermisoEstructuraRequest {
  rolAcceso: RolAcceso;
}
