// =====================================================================================
// correlacion-form.component.ts
// Pequeño formulario para definir el CRITERIO DE CORRELACIÓN de un mensaje: el dato (p. ej. numeroSolicitud) que
// permite unir un mensaje recibido con el caso (instancia del proceso) al que pertenece. El backend exige la
// correlación para poder publicar el proceso.
// A diferencia de los demás formularios NO hereda de FormularioElementoBase: no crea/edita una entidad completa,
// sino un recurso hijo del mensaje (GET / PUT / DELETE de la correlación), así que maneja su propio estado con signals
// y un único FormControl suelto (sin FormGroup).
// =====================================================================================
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CorrelacionResponse } from '../../models/mensaje.model';
import { MensajeService } from '../../service/mensaje.service';
import { NotificacionService } from '../../service/notificacion.service';
import { mensajeDeError } from '../../utils/problema';
import { CampoFormularioComponent } from '../campo-formulario/campo-formulario.component';

/** HU-26: criterio de correlación del mensaje (qué dato une el mensaje con su caso). */
@Component({
  selector: 'app-correlacion-form',
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './correlacion-form.component.html'
})
export class CorrelacionFormComponent implements OnInit {
  /** Servicio HTTP de mensajes (incluye las operaciones de correlación). */
  private readonly mensajeService = inject(MensajeService);
  /** Servicio de avisos emergentes (toasts) de éxito. */
  private readonly notificaciones = inject(NotificacionService);

  /** Mensaje cuya correlación se gestiona. */
  readonly mensajeId = input.required<number>();
  /** Solo quien tiene permiso de edición ve el formulario; los demás ven únicamente el criterio actual. */
  readonly puedeEditar = input<boolean>(false);

  /** Correlación ya guardada (null si el mensaje aún no tiene). */
  readonly correlacion = signal<CorrelacionResponse | null>(null);
  /** True mientras se consulta la correlación inicial. */
  readonly cargando = signal(true);
  /** Mensaje de error del último intento de guardar/quitar. */
  readonly error = signal('');
  /** Campo del criterio: FormControl independiente, obligatorio y no nulo. */
  readonly criterio = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  /** Al iniciar consulta la correlación existente; si la hay, la muestra y rellena el campo. */
  ngOnInit(): void {
    this.mensajeService.obtenerCorrelacion(this.mensajeId()).subscribe({
      next: (c) => {
        this.correlacion.set(c);
        this.criterio.setValue(c.criterio);
        this.cargando.set(false);
      },
      // 404: el mensaje todavía no tiene correlación definida.
      error: () => this.cargando.set(false)
    });
  }

  /** Guarda (crea o reemplaza) el criterio. Si el campo está vacío solo lo marca como tocado para mostrar el error. */
  guardar(): void {
    if (this.criterio.invalid) {
      this.criterio.markAsTouched();
      return;
    }
    this.error.set('');
    this.mensajeService.definirCorrelacion(this.mensajeId(), { criterio: this.criterio.value.trim() }).subscribe({
      next: (c) => {
        this.correlacion.set(c);
        this.notificaciones.exito('Correlación guardada.');
      },
      error: (e: unknown) => this.error.set(mensajeDeError(e))
    });
  }

  /** Elimina la correlación y limpia el estado local y el campo. */
  quitar(): void {
    this.error.set('');
    this.mensajeService.eliminarCorrelacion(this.mensajeId()).subscribe({
      next: () => {
        this.correlacion.set(null);
        this.criterio.reset('');
        this.notificaciones.exito('Correlación eliminada.');
      },
      error: (e: unknown) => this.error.set(mensajeDeError(e))
    });
  }
}
