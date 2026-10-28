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
  private readonly mensajeService = inject(MensajeService);
  private readonly notificaciones = inject(NotificacionService);

  readonly mensajeId = input.required<number>();
  readonly puedeEditar = input<boolean>(false);

  readonly correlacion = signal<CorrelacionResponse | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly criterio = new FormControl('', { nonNullable: true, validators: [Validators.required] });

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
