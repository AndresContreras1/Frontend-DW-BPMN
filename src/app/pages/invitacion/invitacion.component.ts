import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CampoFormularioComponent } from '../../components/campo-formulario/campo-formulario.component';
import { NotificacionService } from '../../service/notificacion.service';
import { UsuarioService } from '../../service/usuario.service';
import { erroresPorCampo, mensajeDeError } from '../../utils/problema';

/** HU-02: la persona invitada acepta el enlace y crea su cuenta. */
@Component({
  selector: 'app-invitacion',
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './invitacion.component.html'
})
export class InvitacionComponent {
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);
  private readonly token: string = inject(ActivatedRoute).snapshot.params['token'];

  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] })
  });

  readonly enviando = signal(false);
  readonly error = signal('');
  readonly erroresServidor = signal<Record<string, string | undefined>>({});

  aceptar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    this.usuarioService.aceptarInvitacion(this.token, this.form.getRawValue()).subscribe({
      next: (usuario) => {
        this.enviando.set(false);
        this.notificaciones.exito('Tu cuenta quedó creada con el correo ' + usuario.email + '. Inicia sesión.');
        void this.router.navigate(['/login']);
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        this.erroresServidor.set(erroresPorCampo(e));
        this.error.set(mensajeDeError(e));
      }
    });
  }
}
