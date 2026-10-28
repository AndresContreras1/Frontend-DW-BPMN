import { Component, computed } from '@angular/core';
import { partirTexto } from '../../utils/diagrama-layout';
import { NodoSvgBase } from './nodo-svg.base';

/**
 * Evento de mensaje: círculo con sobre.
 * Sobre relleno = envío (throw); sobre sin relleno = recepción (catch).
 * Borde sencillo = catch de inicio; doble borde = catch intermedio.
 */
@Component({
  selector: 'g[app-evento-svg]',
  templateUrl: './evento-svg.component.html',
  host: {
    class: 'dg-nodo',
    '[attr.transform]': 'transformacion()',
    '[class.dg-seleccionado]': 'seleccionado()',
    '(click)': 'seleccionar.emit()'
  }
})
export class EventoSvgComponent extends NodoSvgBase {
  readonly esEnvio = computed(() => this.nodo().subtipo === 'THROW');
  readonly esIntermedio = computed(() => this.nodo().subtipo === 'CATCH_INTERMEDIO');
  readonly lineas = computed(() => partirTexto(this.nodo().nombre, 18, 2));
}
