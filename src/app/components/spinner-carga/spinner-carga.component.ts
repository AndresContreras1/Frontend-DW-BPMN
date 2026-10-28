// Componente de presentación mínimo: indicador de carga mientras llega una respuesta del backend.
// Componente de presentación mínimo: indicador de carga mientras llega una respuesta del backend.
// Componente de presentación mínimo: indicador de carga mientras llega una respuesta del backend.
import { Component, input } from '@angular/core';

/** Spinner con texto, reutilizable en cualquier pantalla que cargue datos. */
/** Spinner con texto, reutilizable en cualquier pantalla que cargue datos. */
/** Spinner con texto, reutilizable en cualquier pantalla que cargue datos. */
@Component({
  selector: 'app-spinner-carga',
  templateUrl: './spinner-carga.component.html'
})
export class SpinnerCargaComponent {
  /** Texto junto al spinner; por defecto 'Cargando...'. */
  /** Texto junto al spinner; por defecto 'Cargando...'. */
  /** Texto junto al spinner; por defecto 'Cargando...'. */
  readonly texto = input<string>('Cargando...');
}
