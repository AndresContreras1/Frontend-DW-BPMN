// =====================================================================================
// actividad-svg.component.ts
// Dibuja una ACTIVIDAD BPMN (tarea): rectángulo de esquinas redondeadas con el tipo arriba y el nombre al centro.
// Selector de atributo `g[app-actividad-svg]`: el componente se usa como <g app-actividad-svg>, de modo que el
// elemento real del DOM es un <g> de SVG (si fuera <app-actividad-svg> el navegador no lo pintaría dentro de un <svg>).
// Hereda de NodoSvgBase las entradas `nodo` y `seleccionado`, la salida `seleccionar` y `transformacion`.
// =====================================================================================
import { Component, computed } from '@angular/core';
import { TIPOS_ACTIVIDAD } from '../../models/enums.model';
import { partirTexto } from '../../utils/diagrama-layout';
import { NodoSvgBase } from './nodo-svg.base';

/** Actividad: rectángulo de esquinas redondeadas con su nombre y tipo. */
@Component({
  selector: 'g[app-actividad-svg]',
  templateUrl: './actividad-svg.component.html',
  // `host` configura el elemento <g> que ocupa el componente (en vez de usar @HostBinding/@HostListener).
  host: {
    class: 'dg-nodo',
    // Traslada el nodo a su posición absoluta en el lienzo.
    '[attr.transform]': 'transformacion()',
    // Resalta el nodo cuando está seleccionado.
    '[class.dg-seleccionado]': 'seleccionado()',
    // El clic sobre el <g> se reemite como Output hacia el diagrama.
    '(click)': 'seleccionar.emit()'
  }
})
export class ActividadSvgComponent extends NodoSvgBase {
  /** Nombre partido en líneas de máx. 17 caracteres y 3 líneas, para que quepa en el rectángulo de 120x60. */
  readonly lineas = computed(() => partirTexto(this.nodo().nombre, 17, 3));
  /** Etiqueta legible del tipo de actividad (p. ej. manual, automática); si no se encuentra en el catálogo se muestra el valor crudo. */
  readonly tipo = computed(() => TIPOS_ACTIVIDAD.find((t) => t.valor === this.nodo().subtipo)?.etiqueta ?? this.nodo().subtipo);
  /**
   * Coordenada Y de la primera línea de texto. Con 1 línea empieza en 36 (centro aproximado del alto 60);
   * por cada línea extra sube 7 px para que el bloque de texto (14 px entre líneas) quede centrado verticalmente.
   */
  readonly inicioTexto = computed(() => 36 - (this.lineas().length - 1) * 7);
}
