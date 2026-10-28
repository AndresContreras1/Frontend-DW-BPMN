// Formulario reactivo para crear o editar un rol de proceso (lo que luego nombra las lanes).
// Misma estrategia que ProcesoFormComponent: input() de datos, output() de resultado.
import { Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RolProcesoConsultaResponse, RolProcesoRequest } from '../../models/rol-proceso.model';
import { CampoFormularioComponent } from '../campo-formulario/campo-formulario.component';

/** Formulario de rol de proceso: crea (sin rol) o edita (con rol). */
@Component({
  selector: 'app-rol-proceso-form',
  // ReactiveFormsModule para el formulario y el campo reutilizable como hijo.
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './rol-proceso-form.component.html'
})
export class RolProcesoFormComponent {
  /** Rol a editar; null = modo crear. */
  readonly rol = input<RolProcesoConsultaResponse | null>(null);
  /** Petición en curso, controlada por el padre. */
  readonly enviando = input<boolean>(false);
  /** Errores por campo del backend. */
  readonly errores = input<Record<string, string | undefined>>({});
  /** Evento al padre con los datos limpios (RolProcesoRequest). */
  readonly guardar = output<RolProcesoRequest>();
  /** Evento al padre: se canceló. */
  readonly cancelar = output<void>();

  /** FormGroup tipado: nombre obligatorio y descripción opcional. */
  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    descripcion: new FormControl('', { nonNullable: true })
  });

  constructor() {
    // effect: cuando llega o cambia el rol a editar, reset() carga sus valores (o vacíos si es crear).
    effect(() => {
      const actual = this.rol();
      this.form.reset({ nombre: actual?.nombre ?? '', descripcion: actual?.descripcion ?? '' });
    });
  }

  /** Valida; si es correcto limpia espacios sobrantes y emite. */
  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // Desestructuración del valor del formulario.
    const { nombre, descripcion } = this.form.getRawValue();
    // trim() quita espacios; si la descripción queda vacía se envía undefined para que el campo opcional no viaje.
    this.guardar.emit({ nombre: nombre.trim(), descripcion: descripcion.trim() || undefined });
  }
}
