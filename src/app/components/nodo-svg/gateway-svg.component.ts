import { Component, computed } from '@angular/core';
import { partirTexto } from '../../utils/diagrama-layout';
import { NodoSvgBase } from './nodo-svg.base';

/** Gateway: rombo con X (exclusivo), + (paralelo) o círculo (inclusivo). */
@Component({
  selector: 'g[app-gateway-svg]',
  templateUrl: './gateway-svg.component.html',
  host: {
    class: 'dg-nodo',
    '[attr.transform]': 'transformacion()',
    '[class.dg-seleccionado]': 'seleccionado()',
    '(click)': 'seleccionar.emit()'
  }
})
export class GatewaySvgComponent extends NodoSvgBase {
  readonly puntos = computed(() => {
    const m = this.nodo().ancho / 2;
    return m + ',0 ' + this.nodo().ancho + ',' + m + ' ' + m + ',' + this.nodo().alto + ' 0,' + m;
  });
  readonly lineas = computed(() => partirTexto(this.nodo().nombre, 18, 2));
}
