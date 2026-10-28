// Componente de presentación (tonto): no llama al backend, solo dibuja botones y avisa al padre qué página se pidió.
// Patrón: datos entran por input(), eventos salen por output().
// Componente de presentación (tonto): no llama al backend, solo dibuja botones y avisa al padre qué página se pidió.
// Patrón: datos entran por input(), eventos salen por output().
// Componente de presentación (tonto): no llama al backend, solo dibuja botones y avisa al padre qué página se pidió.
// Patrón: datos entran por input(), eventos salen por output().
import { Component, computed, input, output } from '@angular/core';

/** Paginador reutilizable sobre PageResponse (la página llega en base 0 desde el backend). */
@Component({
  selector: 'app-paginador',
  templateUrl: './paginador.component.html'
})
export class PaginadorComponent {
  /** Página actual en base 0 (como la entrega Spring Page); en pantalla se muestra pagina + 1. */
  /** Página actual en base 0 (como la entrega Spring Page); en pantalla se muestra pagina + 1. */
  /** Página actual en base 0 (como la entrega Spring Page); en pantalla se muestra pagina + 1. */
  readonly pagina = input.required<number>();
  /** Cantidad total de páginas que informa el backend. */
  /** Cantidad total de páginas que informa el backend. */
  /** Cantidad total de páginas que informa el backend. */
  readonly totalPaginas = input.required<number>();
  /** Total de registros, solo para el texto informativo. */
  /** Total de registros, solo para el texto informativo. */
  /** Total de registros, solo para el texto informativo. */
  readonly totalElementos = input<number>(0);
  /** Evento al padre con el índice (base 0) de la página destino; el padre vuelve a consultar. */
  /** Evento al padre con el índice (base 0) de la página destino; el padre vuelve a consultar. */
  /** Evento al padre con el índice (base 0) de la página destino; el padre vuelve a consultar. */
  readonly cambiarPagina = output<number>();

  /** computed: lista [0..n-1] derivada de totalPaginas; se recalcula sola cuando cambia el input. */
  /** computed: lista [0..n-1] derivada de totalPaginas; se recalcula sola cuando cambia el input. */
  /** computed: lista [0..n-1] derivada de totalPaginas; se recalcula sola cuando cambia el input. */
  readonly paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i));
  /** computed: true si existe una página anterior (se usa para deshabilitar el botón Anterior). */
  /** computed: true si existe una página anterior (se usa para deshabilitar el botón Anterior). */
  /** computed: true si existe una página anterior (se usa para deshabilitar el botón Anterior). */
  readonly hayAnterior = computed(() => this.pagina() > 0);
  /** computed: true si existe una página siguiente. */
  /** computed: true si existe una página siguiente. */
  /** computed: true si existe una página siguiente. */
  readonly haySiguiente = computed(() => this.pagina() < this.totalPaginas() - 1);

  /** Emite el cambio solo si el destino es válido y distinto de la página actual (defensa ante clics inválidos). */
  /** Emite el cambio solo si el destino es válido y distinto de la página actual (defensa ante clics inválidos). */
  /** Emite el cambio solo si el destino es válido y distinto de la página actual (defensa ante clics inválidos). */
  ir(destino: number): void {
    if (destino >= 0 && destino < this.totalPaginas() && destino !== this.pagina()) {
      this.cambiarPagina.emit(destino);
    }
  }
}
