import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CampoFormularioComponent } from '../../components/campo-formulario/campo-formulario.component';
import { AuthService } from '../../service/auth.service';
import { NotificacionService } from '../../service/notificacion.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, CampoFormularioComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notificaciones = inject(NotificacionService);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  readonly enviando = signal(false);
  readonly error = signal('');

  ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: (respuesta) => {
        this.enviando.set(false);
        this.notificaciones.exito('Bienvenido, ' + respuesta.usuario.nombre + '.');
        void this.router.navigate(['/procesos']);
      },
      error: () => {
        this.enviando.set(false);
        // Mensaje genérico a propósito: no revela si falló el correo o la contraseña.
        this.error.set('Correo o contraseña incorrectos.');
      }
    });
  }
}
