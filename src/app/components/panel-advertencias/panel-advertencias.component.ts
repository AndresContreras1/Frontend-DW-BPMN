// =====================================================================================
// panel-advertencias.component.ts
// Muestra las advertencias de coherencia del modelo BPMN. El frontend NO valida reglas BPMN por su cuenta:
// solo presenta lo que responde el backend (una sola fuente de verdad, las mismas reglas que se aplican al publicar).
// =====================================================================================
import { Component, input } from '@angular/core';
import { ValidacionModeloResponse } from '../../models/validacion-modelo.model';

/** Advertencias de coherencia del modelo, tal como las calcula el backend (GET /procesos/{id}/validacion). */
@Component({
  selector: 'app-panel-advertencias',
  templateUrl: './panel-advertencias.component.html'
})
export class PanelAdvertenciasComponent {
  /** Respuesta de validación del backend (valido + lista de advertencias); null mientras carga. */
  readonly validacion = input<ValidacionModeloResponse | null>(null);
}
