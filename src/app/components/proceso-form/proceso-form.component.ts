import { Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProcesoRequest, ProcesoResponse } from '../../models/proceso.model';
import { CampoFormularioComponent } from '../campo-formulario/campo-formulario.component';

/** Formulario de proceso: sirve para crear (sin proceso) y para editar (con proceso). */
@Component({
  selector: 'app-proceso-form',
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './proceso-form.component.html'
})
export class ProcesoFormComponent {
  readonly proceso = input<ProcesoResponse | null>(null);
  readonly enviando = input<boolean>(false);
  readonly errores = input<Record<string, string | undefined>>({});
  readonly guardar = output<ProcesoRequest>();
  readonly cancelar = output<void>();

  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(150)] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    categoria: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  constructor() {
    effect(() => {
      const actual = this.proceso();
      if (actual) {
        this.form.setValue({ nombre: actual.nombre, descripcion: actual.descripcion, categoria: actual.categoria });
      }
    });
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardar.emit(this.form.getRawValue());
  }
}
