// Modal reutilizable controlado por el padre: el padre decide cuándo se abre (input) y reacciona a confirmar/cancelar (output).
// No usa JavaScript de Bootstrap: solo sus clases CSS, mostradas con un bloque de control if.
// Modal reutilizable controlado por el padre: el padre decide cuándo se abre (input) y reacciona a confirmar/cancelar (output).
// No usa JavaScript de Bootstrap: solo sus clases CSS, mostradas con un bloque de control if.
// Modal reutilizable controlado por el padre: el padre decide cuándo se abre (input) y reacciona a confirmar/cancelar (output).
// No usa JavaScript de Bootstrap: solo sus clases CSS, mostradas con un bloque de control if.
import { Component, input, output } from '@angular/core';

/** Modal de confirmación (clases de Bootstrap) usado antes de acciones destructivas. */
@Component({
  selector: 'app-modal-confirmacion',
  templateUrl: './modal-confirmacion.component.html'
})
export class ModalConfirmacionComponent {
  /** Si es true se pinta el modal; el padre es dueño de este estado. */
  /** Si es true se pinta el modal; el padre es dueño de este estado. */
  /** Si es true se pinta el modal; el padre es dueño de este estado. */
  readonly abierto = input<boolean>(false);
  /** Título del encabezado. */
  /** Título del encabezado. */
  /** Título del encabezado. */
  readonly titulo = input<string>('Confirmar acción');
  /** Texto principal opcional. */
  /** Texto principal opcional. */
  /** Texto principal opcional. */
  readonly mensaje = input<string>('');
  /** Lista de avisos (por ejemplo, qué quedaría sin salida si se elimina un nodo). */
  /** Lista de avisos (por ejemplo, qué quedaría sin salida si se elimina un nodo). */
  /** Lista de avisos (por ejemplo, qué quedaría sin salida si se elimina un nodo). */
  readonly advertencias = input<string[]>([]);
  /** Texto del botón de confirmar. */
  /** Texto del botón de confirmar. */
  /** Texto del botón de confirmar. */
  readonly textoConfirmar = input<string>('Confirmar');
  /** true = botón rojo (acción destructiva); false = botón primario. */
  /** true = botón rojo (acción destructiva); false = botón primario. */
  /** true = botón rojo (acción destructiva); false = botón primario. */
  readonly peligro = input<boolean>(true);
  /** true mientras la acción confirmada se ejecuta: deshabilita el botón. */
  /** true mientras la acción confirmada se ejecuta: deshabilita el botón. */
  /** true mientras la acción confirmada se ejecuta: deshabilita el botón. */
  readonly procesando = input<boolean>(false);
  /** Evento al padre: el usuario aceptó. */
  /** Evento al padre: el usuario aceptó. */
  /** Evento al padre: el usuario aceptó. */
  readonly confirmar = output<void>();
  /** Evento al padre: el usuario canceló o cerró con la X. */
  /** Evento al padre: el usuario canceló o cerró con la X. */
  /** Evento al padre: el usuario canceló o cerró con la X. */
  readonly cancelar = output<void>();
}
