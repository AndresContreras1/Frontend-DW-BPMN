import { Component, input } from '@angular/core';
import { ValidacionModeloResponse } from '../../models/validacion-modelo.model';

/** Advertencias de coherencia del modelo, tal como las calcula el backend (GET /procesos/{id}/validacion). */
@Component({
  selector: 'app-panel-advertencias',
  templateUrl: './panel-advertencias.component.html'
})
export class PanelAdvertenciasComponent {
  readonly validacion = input<ValidacionModeloResponse | null>(null);
}
