import { Component, computed, input, output } from '@angular/core';

/** Paginador reutilizable sobre PageResponse (la página llega en base 0 desde el backend). */
@Component({
  selector: 'app-paginador',
  templateUrl: './paginador.component.html'
})
export class PaginadorComponent {
  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly totalElementos = input<number>(0);
  readonly cambiarPagina = output<number>();

  readonly paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, i) => i));
  readonly hayAnterior = computed(() => this.pagina() > 0);
  readonly haySiguiente = computed(() => this.pagina() < this.totalPaginas() - 1);

  ir(destino: number): void {
    if (destino >= 0 && destino < this.totalPaginas() && destino !== this.pagina()) {
      this.cambiarPagina.emit(destino);
    }
  }
}
