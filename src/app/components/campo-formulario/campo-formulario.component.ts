import { Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { OpcionLista } from '../../models/enums.model';

export type TipoCampo = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';

/** Campo de formulario reactivo con etiqueta, validación de Bootstrap y mensajes de error. */
@Component({
  selector: 'app-campo-formulario',
  imports: [ReactiveFormsModule],
  templateUrl: './campo-formulario.component.html'
})
export class CampoFormularioComponent {
  readonly control = input.required<FormControl<string>>();
  readonly idCampo = input.required<string>();
  readonly etiqueta = input.required<string>();
  readonly tipo = input<TipoCampo>('text');
  readonly opciones = input<OpcionLista[]>([]);
  readonly ayuda = input<string>('');
  readonly placeholder = input<string>('');
  /** Error devuelto por el backend para este campo (se muestra junto a los del navegador). */
  readonly errorServidor = input<string>('');

  mostrarError(): boolean {
    const c = this.control();
    return c.touched && (c.invalid || this.errorServidor() !== '');
  }

  mensajes(): string[] {
    const errores = this.control().errors;
    const lista: string[] = [];
    if (errores) {
      if (errores['required']) {
        lista.push('Este campo es obligatorio.');
      }
      if (errores['email']) {
        lista.push('El correo no tiene un formato válido.');
      }
      if (errores['minlength']) {
        lista.push('Debe tener al menos ' + errores['minlength'].requiredLength + ' caracteres.');
      }
      if (errores['maxlength']) {
        lista.push('Debe tener máximo ' + errores['maxlength'].requiredLength + ' caracteres.');
      }
      if (errores['min']) {
        lista.push('El valor mínimo es ' + errores['min'].min + '.');
      }
      if (errores['pattern']) {
        lista.push('El formato no es válido.');
      }
    }
    if (this.errorServidor()) {
      lista.push(this.errorServidor());
    }
    return lista;
  }
}
