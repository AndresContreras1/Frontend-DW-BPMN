// Tipos para saber qué elemento del diagrama SVG seleccionó el usuario con un clic.
// Unión de literales con todos los tipos de elementos seleccionables.
export type TipoElementoDiagrama = 'pool' | 'lane' | 'actividad' | 'gateway' | 'evento' | 'arco' | 'mensaje';

/** Elemento del diagrama que el usuario eligió con un clic. */
// La pareja (tipo, id) identifica sin ambigüedad el elemento, porque los ids pueden repetirse entre tipos.
export interface SeleccionDiagrama {
  tipo: TipoElementoDiagrama;
  id: number;
}
