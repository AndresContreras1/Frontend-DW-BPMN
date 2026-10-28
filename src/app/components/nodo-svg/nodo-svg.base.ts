// =====================================================================================
// nodo-svg.base.ts
// Clase base ABSTRACTA compartida por las tres formas SVG de nodo (actividad, gateway, evento).
// Se evita repetir en cada componente las mismas entradas, la misma salida y el mismo cálculo
// de posición: la herencia pone lo común aquí y cada hijo solo añade lo propio de su figura.
// =====================================================================================
import { Directive, computed, input, output } from '@angular/core';
import { NodoVista } from '../../utils/diagrama-layout';

/**
 * Datos y eventos comunes de las formas SVG de los nodos del diagrama.
 * Lleva @Directive() (sin selector) porque Angular exige un decorador en una clase base que usa
 * input()/output(); así los hijos heredan esas entradas y salidas aunque la base no sea un componente.
 */
@Directive()
export abstract class NodoSvgBase {
  /** Nodo a dibujar, con coordenadas ya absolutas dentro del SVG (calculadas por el layout). */
  readonly nodo = input.required<NodoVista>();
  /** True si es el elemento seleccionado; los hijos lo usan para añadir la clase de resaltado. */
  readonly seleccionado = input<boolean>(false);
  /** Output sin datos: solo avisa "me hicieron clic"; el diagrama sabe cuál nodo es. */
  readonly seleccionar = output<void>();

  /**
   * Atributo transform del <g> anfitrión: mueve el origen (0,0) al punto (x,y) del nodo.
   * Gracias a eso las plantillas hijas dibujan siempre desde 0,0 sin conocer su posición real.
   */
  readonly transformacion = computed(() => 'translate(' + this.nodo().x + ' ' + this.nodo().y + ')');
}
