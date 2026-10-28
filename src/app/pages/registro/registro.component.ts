import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CampoFormularioComponent } from '../../components/campo-formulario/campo-formulario.component';
import { EmpresaService } from '../../service/empresa.service';
import { NotificacionService } from '../../service/notificacion.service';
import { erroresPorCampo, mensajeDeError } from '../../utils/problema';

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
  private readonly empresaService = inject(EmpresaService);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);

  readonly form = new FormGroup({
    nombreEmpresa: campo(),
    nit: campo(),
    correoContacto: campo(Validators.email),
    nombreAdmin: campo(),
    emailAdmin: campo(Validators.email),
    passwordAdmin: campo(Validators.minLength(6))
  });

  readonly enviando = signal(false);
  readonly error = signal('');
  readonly erroresServidor = signal<Record<string, string>>({});

  registrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    this.erroresServidor.set({});
    this.empresaService.registrar(this.form.getRawValue()).subscribe({
      next: (empresa) => {
        this.enviando.set(false);
        this.notificaciones.exito('La empresa ' + empresa.nombre + ' quedó registrada. Ya puedes iniciar sesión.');
        void this.router.navigate(['/login']);
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        const porCampo = erroresPorCampo(e);
        this.erroresServidor.set(porCampo);
        this.error.set(Object.keys(porCampo).length > 0 ? 'Revisa los campos marcados.' : mensajeDeError(e));
      }
    });
  }
}
