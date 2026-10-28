import { Directive, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { erroresPorCampo, mensajeDeError } from '../utils/problema';

/**
 * Comportamiento común de los formularios del editor: estado de envío, errores del backend
 * (ProblemDetail) y los eventos hacia el padre. Cada formulario solo arma su petición.
 */
@Directive()
export abstract class FormularioElementoBase<R> {
  readonly guardado = output<R>();
  readonly cancelar = output<void>();

  readonly enviando = signal(false);
  readonly error = signal('');
  readonly erroresServidor = signal<Record<string, string | undefined>>({});

  protected enviar(peticion: Observable<R>): void {
    this.enviando.set(true);
    this.error.set('');
    this.erroresServidor.set({});
    peticion.subscribe({
      next: (resultado) => {
        this.enviando.set(false);
        this.guardado.emit(resultado);
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        this.erroresServidor.set(erroresPorCampo(e));
        this.error.set(mensajeDeError(e));
      }
    });
  }
}
