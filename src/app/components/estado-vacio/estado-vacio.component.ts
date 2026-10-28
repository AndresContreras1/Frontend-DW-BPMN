// Componente de presentación mínimo: mensaje cuando una lista no tiene datos.
// Componente de presentación mínimo: mensaje cuando una lista no tiene datos.
// Componente de presentación mínimo: mensaje cuando una lista no tiene datos.
import { Component, input } from '@angular/core';

/** Aviso de 'sin datos' reutilizable en todas las listas. */
/** Aviso de 'sin datos' reutilizable en todas las listas. */
/** Aviso de 'sin datos' reutilizable en todas las listas. */
@Component({
  selector: 'app-estado-vacio',
  templateUrl: './estado-vacio.component.html'
})
export class EstadoVacioComponent {
  /** Texto a mostrar; el padre puede personalizarlo, si no usa el valor por defecto. */
  /** Texto a mostrar; el padre puede personalizarlo, si no usa el valor por defecto. */
  /** Texto a mostrar; el padre puede personalizarlo, si no usa el valor por defecto. */
  readonly mensaje = input<string>('No hay información para mostrar.');
}
