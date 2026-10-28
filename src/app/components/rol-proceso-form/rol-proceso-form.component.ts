import { Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolProcesoConsultaResponse, RolProcesoRequest } from '../../models/rol-proceso.model';
import { CampoFormularioComponent } from '../campo-formulario/campo-formulario.component';

/** Formulario de rol de proceso: crea (sin rol) o edita (con rol). */
@Component({
  selector: 'app-rol-proceso-form',
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './rol-proceso-form.component.html'
})
export class RolProcesoFormComponent {
  readonly rol = input<RolProcesoConsultaResponse | null>(null);
  readonly enviando = input<boolean>(false);
  readonly errores = input<Record<string, string | undefined>>({});
  readonly guardar = output<RolProcesoRequest>();
  readonly cancelar = output<void>();

  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    descripcion: new FormControl('', { nonNullable: true })
  });

  constructor() {
    effect(() => {
      const actual = this.rol();
      this.form.reset({ nombre: actual?.nombre ?? '', descripcion: actual?.descripcion ?? '' });
    });
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { nombre, descripcion } = this.form.getRawValue();
    this.guardar.emit({ nombre: nombre.trim(), descripcion: descripcion.trim() || undefined });
  }
}
