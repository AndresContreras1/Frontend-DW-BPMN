// Formulario para invitar usuarios. A diferencia de los otros formularios, este componente sí llama al servicio
// (UsuarioService) y solo avisa al padre con el resultado por output().
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
  // ReactiveFormsModule + campo reutilizable.
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './invitar-usuario.component.html'
})
export class InvitarUsuarioComponent {
  /** Servicio HTTP de usuarios. */
  private readonly usuarioService = inject(UsuarioService);

  /** Evento al padre con la invitación creada (el padre refresca su lista). */
  readonly invitada = output<InvitacionUsuarioResponse>();
  /** Opciones del select, tomadas de la constante compartida de roles de acceso. */
  readonly roles = ROLES_ACCESO;

  /** Correo (obligatorio y con formato email) y rol de acceso con valor inicial EDITOR. */
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    rolAcceso: new FormControl<string>('EDITOR', { nonNullable: true, validators: [Validators.required] })
  });

  /** signal: petición en curso (bloquea el botón). */
  readonly enviando = signal(false);
  /** signal: mensaje de error general. */
  readonly error = signal('');

  /** Valida, envía la invitación y, si funciona, limpia el correo para invitar a otra persona. */
  invitar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    const { email, rolAcceso } = this.form.getRawValue();
    // El select entrega string; 'as RolAcceso' lo estrecha al tipo que exige el modelo.
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
