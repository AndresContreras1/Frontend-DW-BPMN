import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OpcionLista, TIPOS_EVENTO_MENSAJE, TipoEventoMensaje } from '../../models/enums.model';
import { EventoMensajeResponse } from '../../models/evento-mensaje.model';
import { EventoMensajeService } from '../../service/evento-mensaje.service';
import { DatosDiagrama } from '../../utils/diagrama-layout';
import { sugerirPosicion } from '../../utils/posicion';
import { CampoFormularioComponent } from '../campo-formulario/campo-formulario.component';
import { FormularioElementoBase } from '../formulario-elemento.base';

/**
 * HU-25 y HU-27: evento de mensaje. THROW envía, CATCH_INICIO inicia el proceso al recibir,
 * CATCH_INTERMEDIO espera un mensaje a mitad del flujo. La clave de correlación es obligatoria.
 * El sistema solo modela: no envía ni recibe mensajes reales.
 */
@Component({
  selector: 'app-evento-form',
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './evento-form.component.html'
})
export class EventoFormComponent extends FormularioElementoBase<EventoMensajeResponse> implements OnInit {
  private readonly eventoService = inject(EventoMensajeService);

  readonly datos = input.required<DatosDiagrama>();
  readonly evento = input<EventoMensajeResponse | null>(null);
  readonly laneInicial = input<number | undefined>(undefined);
  readonly tipos = TIPOS_EVENTO_MENSAJE;

  readonly opcionesLanes = computed<OpcionLista[]>(() =>
    this.datos().lanes.map((l) => ({
      valor: String(l.id),
      etiqueta: l.rolProcesoNombre + ' · ' + (this.datos().pools.find((p) => p.id === l.poolId)?.nombre ?? '')
    }))
  );

  readonly actividadIds = signal<number[]>([]);
  readonly esCatch = signal(false);

  readonly actividades = computed(() =>
    this.datos().actividades.map((a) => ({ id: a.id, nombre: a.nombre }))
  );

  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipoEvento: new FormControl<string>('THROW', { nonNullable: true, validators: [Validators.required] }),
    contenido: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    claveCorrelacion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    origenExterno: new FormControl(false, { nonNullable: true }),
    laneId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    posicionX: new FormControl('80', { nonNullable: true, validators: [Validators.required, Validators.pattern('^[0-9]+$')] }),
    posicionY: new FormControl('60', { nonNullable: true, validators: [Validators.required, Validators.pattern('^[0-9]+$')] })
  });

  ngOnInit(): void {
    const actual = this.evento();
    if (actual) {
      this.form.setValue({
        nombre: actual.nombre,
        tipoEvento: actual.tipoEvento,
        contenido: actual.contenido,
        claveCorrelacion: actual.claveCorrelacion,
        origenExterno: actual.origenExterno,
        laneId: String(actual.laneId),
        posicionX: String(actual.posicionX),
        posicionY: String(actual.posicionY)
      });
      this.actividadIds.set(actual.actividadIds ?? []);
      this.actualizarTipo();
      return;
    }
    const laneId = this.laneInicial() ?? this.datos().lanes[0]?.id;
    if (laneId !== undefined) {
      this.form.controls.laneId.setValue(String(laneId));
      this.sugerir();
    }
  }

  /** Solo un Message Catch puede indicar las actividades que usan los datos del mensaje. */
  actualizarTipo(): void {
    this.esCatch.set(this.form.controls.tipoEvento.value !== 'THROW');
    if (!this.esCatch()) {
      this.actividadIds.set([]);
    }
  }

  alternarActividad(id: number): void {
    this.actividadIds.update((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  alCambiarLane(): void {
    if (!this.evento()) {
      this.sugerir();
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos = {
      nombre: v.nombre.trim(),
      tipoEvento: v.tipoEvento as TipoEventoMensaje,
      contenido: v.contenido.trim(),
      claveCorrelacion: v.claveCorrelacion.trim(),
      origenExterno: v.origenExterno,
      posicionX: Number(v.posicionX),
      posicionY: Number(v.posicionY),
      laneId: Number(v.laneId),
      actividadIds: this.esCatch() ? this.actividadIds() : undefined
    };
    const actual = this.evento();
    this.enviar(actual ? this.eventoService.editar(actual.id, datos) : this.eventoService.crear(Number(v.laneId), datos));
  }

  private sugerir(): void {
    const laneId = Number(this.form.controls.laneId.value);
    if (!Number.isNaN(laneId) && laneId > 0) {
      const p = sugerirPosicion(this.datos(), laneId);
      this.form.patchValue({ posicionX: String(p.x), posicionY: String(p.y) });
    }
  }
}
