import { Component, inject, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CampoFormularioComponent } from '../campo-formulario/campo-formulario.component';
import { ROLES_ACCESO, RolAcceso } from '../../models/enums.model';
import { InvitacionUsuarioResponse } from '../../models/usuario.model';
import { UsuarioService } from '../../service/usuario.service';
import { mensajeDeError } from '../../utils/problema';

/** Formulario para invitar por correo; avisa al padre con la invitación creada (Output). */
@Component({
  selector: 'app-invitar-usuario',
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './invitar-usuario.component.html'
})
export class InvitarUsuarioComponent {
  private readonly usuarioService = inject(UsuarioService);

  readonly invitada = output<InvitacionUsuarioResponse>();
  readonly roles = ROLES_ACCESO;

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    rolAcceso: new FormControl<string>('EDITOR', { nonNullable: true, validators: [Validators.required] })
  });

  readonly enviando = signal(false);
  readonly error = signal('');

  invitar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    const { email, rolAcceso } = this.form.getRawValue();
    this.usuarioService.invitar({ email, rolAcceso: rolAcceso as RolAcceso }).subscribe({
      next: (invitacion) => {
        this.enviando.set(false);
        this.invitada.emit(invitacion);
        this.form.controls.email.reset('');
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        this.error.set(mensajeDeError(e));
      }
    });
  }
}
