export type TipoElementoDiagrama = 'pool' | 'lane' | 'actividad' | 'gateway' | 'evento' | 'arco' | 'mensaje';

/** Elemento del diagrama que el usuario eligió con un clic. */
export interface SeleccionDiagrama {
  tipo: TipoElementoDiagrama;
  id: number;
}
