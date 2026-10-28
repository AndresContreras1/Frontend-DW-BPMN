import { Component, computed, input } from '@angular/core';
import { DatosDiagrama } from '../../utils/diagrama-layout';
import { calcularAdvertencias } from '../../utils/advertencias-modelo';

/** Lista de advertencias de coherencia del modelo (se actualiza con cada cambio del diagrama). */
@Component({
  selector: 'app-panel-advertencias',
  templateUrl: './panel-advertencias.component.html'
})
export class PanelAdvertenciasComponent {
  readonly datos = input.required<DatosDiagrama>();
  readonly advertencias = computed(() => calcularAdvertencias(this.datos()));
}
