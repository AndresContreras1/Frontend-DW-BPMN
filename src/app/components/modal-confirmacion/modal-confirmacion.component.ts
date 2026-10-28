import { Component, input, output } from '@angular/core';

/** Modal de confirmación (clases de Bootstrap) usado antes de acciones destructivas. */
@Component({
  selector: 'app-modal-confirmacion',
  templateUrl: './modal-confirmacion.component.html'
})
export class ModalConfirmacionComponent {
  readonly abierto = input<boolean>(false);
  readonly titulo = input<string>('Confirmar acción');
  readonly mensaje = input<string>('');
  readonly advertencias = input<string[]>([]);
  readonly textoConfirmar = input<string>('Confirmar');
  readonly peligro = input<boolean>(true);
  readonly procesando = input<boolean>(false);
  readonly confirmar = output<void>();
  readonly cancelar = output<void>();
}
