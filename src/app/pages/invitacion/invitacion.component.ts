// Página pública /invitacion/:token (HU-02). La persona invitada llega desde el enlace del correo, completa nombre y contraseña
// y el backend crea su cuenta con el rol de acceso que le asignó el administrador.
// Conceptos: ActivatedRoute.snapshot.params para leer el token de la URL, formulario reactivo y manejo de errores del backend (ProblemDetail).
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
  /** Servicio de usuarios: expone aceptarInvitacion(token, datos) hacia el backend. */
  private readonly usuarioService = inject(UsuarioService);
  /** Router para ir al login una vez creada la cuenta. */
  private readonly router = inject(Router);
  /** Toast de éxito al crear la cuenta. */
  private readonly notificaciones = inject(NotificacionService);
  /**
   * Token de la invitación, leído UNA vez de la URL (:token) con ActivatedRoute.snapshot.params.
   * snapshot es una foto de la ruta al crear el componente; basta aquí porque el token no cambia mientras la página está abierta.
   */
  private readonly token: string = inject(ActivatedRoute).snapshot.params['token'];

  /** Formulario reactivo: nombre obligatorio; contraseña obligatoria con mínimo de 8 caracteres (misma regla del backend). */
  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8)] })
  });

  /** Signal: petición en curso (bloquea el botón). */
  readonly enviando = signal(false);
  /** Signal con el mensaje general de error (alerta superior). */
  readonly error = signal('');
  /**
   * Signal con errores por campo que devuelve el backend en un 400 de validación (clave = nombre del campo).
   * Se pasan a cada campo para mostrarlos junto al input.
   */
  readonly erroresServidor = signal<Record<string, string | undefined>>({});

  /** Envía la aceptación: valida en cliente, marca campos tocados si es inválido y, si es válido, llama al backend con el token y los datos. */
  aceptar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    this.usuarioService.aceptarInvitacion(this.token, this.form.getRawValue()).subscribe({
      // Éxito: la cuenta existe; se informa el correo asignado y se envía al login (aún no hay sesión iniciada).
      next: (usuario) => {
        this.enviando.set(false);
        this.notificaciones.exito('Tu cuenta quedó creada con el correo ' + usuario.email + '. Inicia sesión.');
        void this.router.navigate(['/login']);
      },
      // Fallo: erroresPorCampo extrae los errores 400 por campo; mensajeDeError traduce el ProblemDetail (400/404 token inválido/409, etc.)
      // a un texto legible para la alerta general.
      error: (e: unknown) => {
        this.enviando.set(false);
        this.erroresServidor.set(erroresPorCampo(e));
        this.error.set(mensajeDeError(e));
      }
    });
  }
}
