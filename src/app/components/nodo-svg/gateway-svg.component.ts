// =====================================================================================
// gateway-svg.component.ts
// Dibuja un GATEWAY BPMN (compuerta de decisión/sincronización): un rombo con un símbolo dentro.
//   - Exclusivo (X): se toma UN solo camino según la condición.
//   - Paralelo (+): se toman TODOS los caminos a la vez (o se espera a todos al unirse).
//   - Inclusivo (círculo): se toman UNO O VARIOS caminos cuyas condiciones se cumplan.
// Selector de atributo g[app-gateway-svg] y herencia de NodoSvgBase.
// =====================================================================================
import { Component, computed } from '@angular/core';
import { partirTexto } from '../../utils/diagrama-layout';
import { NodoSvgBase } from './nodo-svg.base';

/** Gateway: rombo con X (exclusivo), + (paralelo) o círculo (inclusivo). */
@Component({
  selector: 'g[app-gateway-svg]',
  templateUrl: './gateway-svg.component.html',
  // Configuración del <g> anfitrión: posición, resaltado de selección y reemisión del clic.
  host: {
    class: 'dg-nodo',
    '[attr.transform]': 'transformacion()',
    '[class.dg-seleccionado]': 'seleccionado()',
    '(click)': 'seleccionar.emit()'
  }
})
export class GatewaySvgComponent extends NodoSvgBase {
  /**
   * Los 4 vértices del rombo para el atributo `points` del polígono, con m = mitad del ancho (25 si el gateway mide 50):
   * arriba (m,0), derecha (ancho,m), abajo (m,alto) e izquierda (0,m). Se asume nodo cuadrado (ancho = alto).
   */
  readonly puntos = computed(() => {
    const m = this.nodo().ancho / 2;
    return m + ',0 ' + this.nodo().ancho + ',' + m + ' ' + m + ',' + this.nodo().alto + ' 0,' + m;
  });
  /** Nombre en líneas de máx. 18 caracteres y 2 líneas, escrito debajo del rombo. */
  readonly lineas = computed(() => partirTexto(this.nodo().nombre, 18, 2));
}
