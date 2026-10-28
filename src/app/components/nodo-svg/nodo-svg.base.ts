import { Directive, computed, input, output } from '@angular/core';
import { NodoVista } from '../../utils/diagrama-layout';

/** Datos y eventos comunes de las formas SVG de los nodos del diagrama. */
@Directive()
export abstract class NodoSvgBase {
  readonly nodo = input.required<NodoVista>();
  readonly seleccionado = input<boolean>(false);
  readonly seleccionar = output<void>();

  readonly transformacion = computed(() => 'translate(' + this.nodo().x + ' ' + this.nodo().y + ')');
}
