import { Component, computed } from '@angular/core';
import { TIPOS_ACTIVIDAD } from '../../models/enums.model';
import { partirTexto } from '../../utils/diagrama-layout';
import { NodoSvgBase } from './nodo-svg.base';

/** Actividad: rectángulo de esquinas redondeadas con su nombre y tipo. */
@Component({
  selector: 'g[app-actividad-svg]',
  templateUrl: './actividad-svg.component.html',
  host: {
    class: 'dg-nodo',
    '[attr.transform]': 'transformacion()',
    '[class.dg-seleccionado]': 'seleccionado()',
    '(click)': 'seleccionar.emit()'
  }
})
export class ActividadSvgComponent extends NodoSvgBase {
  readonly lineas = computed(() => partirTexto(this.nodo().nombre, 17, 3));
  readonly tipo = computed(() => TIPOS_ACTIVIDAD.find((t) => t.valor === this.nodo().subtipo)?.etiqueta ?? this.nodo().subtipo);
  readonly inicioTexto = computed(() => 36 - (this.lineas().length - 1) * 7);
}
