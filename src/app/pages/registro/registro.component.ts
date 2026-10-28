// Página pública /registro (HU-01): registro de una empresa junto con su administrador en una sola petición.
// Conceptos: formulario reactivo con fábrica de controles, errores de validación del backend (400) asociados a cada campo,
// NIT único (si ya existe, el backend rechaza y mensajeDeError traduce el ProblemDetail).
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CampoFormularioComponent } from '../../components/campo-formulario/campo-formulario.component';
import { EmpresaService } from '../../service/empresa.service';
import { NotificacionService } from '../../service/notificacion.service';
import { erroresPorCampo, mensajeDeError } from '../../utils/problema';

/**
 * Fábrica de controles de texto: siempre obligatorios (Validators.required) más los validadores extra que se pasen (email, minLength).
 * Evita repetir la configuración nonNullable en los 6 campos.
 */
function campo(...validadores: ValidatorFn[]): FormControl<string> {
  return new FormControl('', { nonNullable: true, validators: [Validators.required, ...validadores] });
}

/** HU-01: registro de empresa junto con su administrador. */
@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, CampoFormularioComponent],
  templateUrl: './registro.component.html'
})
export class RegistroComponent {
  /** Servicio de empresas: registrar() envía empresa + administrador al backend. */
  private readonly empresaService = inject(EmpresaService);
  /** Router para ir al login tras registrar. */
  private readonly router = inject(Router);
  /** Toast de confirmación. */
  private readonly notificaciones = inject(NotificacionService);

  /** Un solo FormGroup con los datos de la empresa (nombre, NIT, correo de contacto) y del administrador (nombre, correo, contraseña de mínimo 8). Sus claves coinciden con el cuerpo que espera el backend. */
  readonly form = new FormGroup({
    nombreEmpresa: campo(),
    nit: campo(),
    correoContacto: campo(Validators.email),
    nombreAdmin: campo(),
    emailAdmin: campo(Validators.email),
    passwordAdmin: campo(Validators.minLength(8))
  });

  /** Signal: petición en curso. */
  readonly enviando = signal(false);
  /** Signal con el mensaje general de la alerta. */
  readonly error = signal('');
  /** Errores por campo devueltos por el backend (400); se muestran junto a cada input. */
  readonly erroresServidor = signal<Record<string, string | undefined>>({});

  /** Valida en cliente; si es válido limpia errores previos y envía la petición. getRawValue() entrega el objeto completo del formulario. */
  registrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    this.erroresServidor.set({});
    this.empresaService.registrar(this.form.getRawValue()).subscribe({
      // Éxito: avisa con el nombre de la empresa creada y manda al login (el administrador ya puede entrar).
      next: (empresa) => {
        this.enviando.set(false);
        this.notificaciones.exito('La empresa ' + empresa.nombre + ' quedó registrada. Ya puedes iniciar sesión.');
        void this.router.navigate(['/login']);
      },
      // Si el backend devolvió errores por campo se indica 'Revisa los campos marcados.' (los detalles salen bajo cada input);
      // si no (p. ej. NIT duplicado), se muestra el mensaje general del ProblemDetail.
      error: (e: unknown) => {
        this.enviando.set(false);
        const porCampo = erroresPorCampo(e);
        this.erroresServidor.set(porCampo);
        this.error.set(Object.keys(porCampo).length > 0 ? 'Revisa los campos marcados.' : mensajeDeError(e));
      }
    });
  }
}
