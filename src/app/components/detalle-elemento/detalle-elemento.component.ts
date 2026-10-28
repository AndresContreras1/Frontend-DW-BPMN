// =====================================================================================
// detalle-elemento.component.ts
// Panel de SOLO LECTURA que muestra las propiedades del elemento (pool, lane, actividad, gateway,
// evento, arco o mensaje) seleccionado en el diagrama. Componente "tonto": no guarda estado,
// solo transforma sus inputs en un texto descriptivo con la función pura `describirElemento`.
// =====================================================================================
import { Component, computed, input } from '@angular/core';
import { SeleccionDiagrama } from '../../models/seleccion-diagrama.model';
import { DatosDiagrama } from '../../utils/diagrama-layout';
import { describirElemento } from '../../utils/descripcion-elemento';

/** Panel de solo lectura con las propiedades del elemento elegido en el diagrama. */
@Component({
  selector: 'app-detalle-elemento',
  templateUrl: './detalle-elemento.component.html'
})
export class DetalleElementoComponent {
  /** Modelo completo del proceso; de aquí se busca el elemento por tipo e id. */
  readonly datos = input.required<DatosDiagrama>();
  /** Elemento elegido (tipo + id) o null si no hay ninguno. */
  readonly seleccion = input<SeleccionDiagrama | null>(null);

  /**
   * Descripción lista para mostrar (tipo, título y filas etiqueta/valor), o null si no hay selección
   * o el elemento ya no existe. Se recalcula sola cuando cambia `datos` o `seleccion` (computed).
   */
  readonly descripcion = computed(() => describirElemento(this.datos(), this.seleccion()));
}
