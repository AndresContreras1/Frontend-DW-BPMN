// Formulario reactivo (FormGroup) reutilizado para crear y editar un proceso.
// El padre le pasa datos con input() y recibe el resultado con output(); este componente no habla con el backend.
import { Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProcesoRequest, ProcesoResponse } from '../../models/proceso.model';
import { CampoFormularioComponent } from '../campo-formulario/campo-formulario.component';

/** Formulario de proceso: sirve para crear (sin proceso) y para editar (con proceso). */
@Component({
  selector: 'app-proceso-form',
  // ReactiveFormsModule para [formGroup]; CampoFormularioComponent es el hijo que pinta cada campo.
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './proceso-form.component.html'
})
export class ProcesoFormComponent {
  /** Proceso a editar; null = modo crear. Cambia el texto del botón y precarga el formulario. */
  readonly proceso = input<ProcesoResponse | null>(null);
  /** El padre indica que la petición está en curso para bloquear el botón. */
  readonly enviando = input<boolean>(false);
  /** Errores por campo devueltos por el backend; cada campo-formulario muestra el suyo. */
  readonly errores = input<Record<string, string | undefined>>({});
  /** Evento al padre con los datos válidos (ProcesoRequest). El padre hace la petición HTTP. */
  readonly guardar = output<ProcesoRequest>();
  /** Evento al padre: se canceló la edición. */
  readonly cancelar = output<void>();

  /**
   * FormGroup tipado: cada FormControl declara su valor inicial y sus validadores.
   * nonNullable: true hace que reset() vuelva a '' y que el valor sea string (nunca null).
   */
  readonly form = new FormGroup({
    // Obligatorio y máximo 150 caracteres.
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(150)] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    categoria: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  // El constructor es contexto de inyección válido para crear un effect().
  constructor() {
    // effect: se vuelve a ejecutar cuando cambia el signal proceso(); así, al llegar el proceso a editar, se rellena el formulario.
    effect(() => {
      const actual = this.proceso();
      if (actual) {
        this.form.setValue({ nombre: actual.nombre, descripcion: actual.descripcion, categoria: actual.categoria });
      }
    });
  }

  /** Si el formulario es inválido marca todo como tocado (para que se vean los errores); si es válido emite los datos. */
  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // getRawValue() devuelve todos los controles con la forma exacta de ProcesoRequest.
    this.guardar.emit(this.form.getRawValue());
  }
}
