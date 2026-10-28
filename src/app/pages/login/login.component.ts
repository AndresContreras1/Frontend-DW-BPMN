// Página de inicio de sesión (ruta pública /login). Autenticación de usuarios de la empresa; en el código no lleva HU numerada,
// es el paso previo a las HU que exigen sesión (rutas protegidas por authGuard/rolGuard).
// Conceptos: formulario reactivo (FormGroup + validadores), signals de estado, suscripción con next/error y navegación con Router.
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CampoFormularioComponent } from '../../components/campo-formulario/campo-formulario.component';
import { AuthService } from '../../service/auth.service';
import { NotificacionService } from '../../service/notificacion.service';

/** Página de login: formulario reactivo con correo y contraseña; si el backend acepta, guarda sesión (AuthService) y navega a /procesos. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, CampoFormularioComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  /** Servicio que llama al backend (POST de login) y guarda el token/usuario de la sesión. */
  private readonly auth = inject(AuthService);
  /** Router: permite navegar por código (this.router.navigate) tras el login exitoso. */
  private readonly router = inject(Router);
  /** Muestra mensajes tipo toast (éxito/error) al usuario. */
  private readonly notificaciones = inject(NotificacionService);

  /**
   * Formulario reactivo tipado. nonNullable evita valores null (el reset vuelve a '').
   * Validación en cliente: correo obligatorio y con formato; contraseña solo obligatoria (el mínimo de 8 se exige al crearla, no al entrar).
   */
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  /** Signal: true mientras la petición está en vuelo; deshabilita el botón para evitar doble envío. */
  readonly enviando = signal(false);
  /** Signal con el mensaje de error a mostrar en la alerta ('' = sin error). */
  readonly error = signal('');

  /**
   * Se ejecuta con (ngSubmit). Si el formulario es inválido marca todos los campos como tocados (para que se vean los errores)
   * y no llama al backend. Si es válido, hace la petición y se suscribe con next (éxito) / error (fallo).
   */
  ingresar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      // Éxito (backend responde 200): apaga el spinner, avisa y navega a la lista de procesos.
      next: (respuesta) => {
        this.enviando.set(false);
        this.notificaciones.exito('Bienvenido, ' + respuesta.usuario.nombre + '.');
        void this.router.navigate(['/procesos']);
      },
      // Cualquier fallo (401 credenciales inválidas u otro) se trata igual: apaga el estado de envío y muestra mensaje genérico.
      error: () => {
        this.enviando.set(false);
        // Mensaje genérico a propósito: no revela si falló el correo o la contraseña.
        this.error.set('Correo o contraseña incorrectos.');
      }
    });
  }
}
