import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  OpcionLista,
  POLITICAS_FALLO,
  POLITICAS_SIN_CASO,
  PoliticaFalloNotificacion,
  PoliticaMensajeSinCaso,
  TIPOS_DESTINO_EXTERNO,
  TipoDestinoExterno
} from '../../models/enums.model';
import { MensajeResponse } from '../../models/mensaje.model';
import { MensajeService } from '../../service/mensaje.service';
import { DatosDiagrama } from '../../utils/diagrama-layout';
import { CampoFormularioComponent } from '../campo-formulario/campo-formulario.component';
import { FormularioElementoBase } from '../formulario-elemento.base';

const NINGUNO: OpcionLista = { valor: '', etiqueta: '— Ninguno —' };

/**
 * HU-25 a HU-28: mensaje entre dos pools (línea punteada). Se asocia a un Message Throw del pool
 * de origen y a un Message Catch del destino, o a un destino externo (correo, servicio web o cola).
 * El sistema solo modela la notificación; nunca envía nada.
 */
@Component({
  selector: 'app-mensaje-form',
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './mensaje-form.component.html'
})
export class MensajeFormComponent extends FormularioElementoBase<MensajeResponse> implements OnInit {
  private readonly mensajeService = inject(MensajeService);

  readonly procesoId = input.required<number>();
  readonly datos = input.required<DatosDiagrama>();
  readonly mensaje = input<MensajeResponse | null>(null);

  readonly tiposDestino: OpcionLista[] = [NINGUNO, ...TIPOS_DESTINO_EXTERNO];
  readonly politicasFallo: OpcionLista[] = [NINGUNO, ...POLITICAS_FALLO];
  readonly politicasSinCaso: OpcionLista[] = [NINGUNO, ...POLITICAS_SIN_CASO];

  private readonly poolOrigen = signal<number | null>(null);
  private readonly poolDestino = signal<number | null>(null);
  readonly derivaAError = signal(false);
  readonly conDestinoExterno = signal(false);

  readonly opcionesPools = computed<OpcionLista[]>(() => this.datos().pools.map((p) => ({ valor: String(p.id), etiqueta: p.nombre })));

  private lanesDe(poolId: number | null): Set<number> {
    return new Set(this.datos().lanes.filter((l) => l.poolId === poolId).map((l) => l.id));
  }

  readonly opcionesThrow = computed<OpcionLista[]>(() => {
    const lanes = this.lanesDe(this.poolOrigen());
    return [NINGUNO, ...this.datos().eventos.filter((e) => e.tipoEvento === 'THROW' && lanes.has(e.laneId)).map((e) => ({ valor: String(e.id), etiqueta: e.nombre }))];
  });

  readonly opcionesCatch = computed<OpcionLista[]>(() => {
    const lanes = this.lanesDe(this.poolDestino());
    return [NINGUNO, ...this.datos().eventos.filter((e) => e.tipoEvento !== 'THROW' && lanes.has(e.laneId)).map((e) => ({ valor: String(e.id), etiqueta: e.nombre }))];
  });

  readonly opcionesActividadError = computed<OpcionLista[]>(() => {
    const lanes = this.lanesDe(this.poolOrigen());
    return [NINGUNO, ...this.datos().actividades.filter((a) => lanes.has(a.laneId)).map((a) => ({ valor: String(a.id), etiqueta: a.nombre }))];
  });

  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contenido: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    poolOrigenId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    poolDestinoId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    eventoThrowId: new FormControl('', { nonNullable: true }),
    eventoCatchId: new FormControl('', { nonNullable: true }),
    claveCorrelacion: new FormControl('', { nonNullable: true }),
    tipoDestinoExterno: new FormControl('', { nonNullable: true }),
    destinoExterno: new FormControl('', { nonNullable: true }),
    politicaFalloNotificacion: new FormControl('', { nonNullable: true }),
    actividadErrorId: new FormControl('', { nonNullable: true }),
    politicaSinCaso: new FormControl('', { nonNullable: true })
  });

  ngOnInit(): void {
    const actual = this.mensaje();
    if (actual) {
      this.form.setValue({
        nombre: actual.nombre,
        contenido: actual.contenido,
        poolOrigenId: String(actual.poolOrigenId),
        poolDestinoId: String(actual.poolDestinoId),
        eventoThrowId: actual.eventoThrowId ? String(actual.eventoThrowId) : '',
        eventoCatchId: actual.eventoCatchId ? String(actual.eventoCatchId) : '',
        claveCorrelacion: actual.claveCorrelacion ?? '',
        tipoDestinoExterno: actual.tipoDestinoExterno ?? '',
        destinoExterno: actual.destinoExterno ?? '',
        politicaFalloNotificacion: actual.politicaFalloNotificacion ?? '',
        actividadErrorId: actual.actividadErrorId ? String(actual.actividadErrorId) : '',
        politicaSinCaso: actual.politicaSinCaso ?? ''
      });
      this.form.controls.poolOrigenId.disable();
      this.form.controls.poolDestinoId.disable();
      this.form.controls.eventoThrowId.disable();
    } else if (this.datos().pools.length > 0) {
      const pools = this.datos().pools;
      this.form.patchValue({ poolOrigenId: String(pools[0].id), poolDestinoId: String((pools[1] ?? pools[0]).id) });
    }
    this.actualizarDependencias();
  }

  /** Recalcula los selectores que dependen de otros (eventos por pool, actividad de error, destino externo). */
  actualizarDependencias(): void {
    const v = this.form.getRawValue();
    this.poolOrigen.set(v.poolOrigenId ? Number(v.poolOrigenId) : null);
    this.poolDestino.set(v.poolDestinoId ? Number(v.poolDestinoId) : null);
    this.derivaAError.set(v.politicaFalloNotificacion === 'DERIVAR_ACTIVIDAD_ERROR');
    this.conDestinoExterno.set(v.tipoDestinoExterno !== '');
    if (v.eventoThrowId && !this.opcionesThrow().some((o) => o.valor === v.eventoThrowId)) {
      this.form.controls.eventoThrowId.setValue('');
    }
    this.proponerNombre(v.eventoThrowId);
    if (v.eventoCatchId && !this.opcionesCatch().some((o) => o.valor === v.eventoCatchId)) {
      this.form.controls.eventoCatchId.setValue('');
    }
  }

  /** El backend exige que el nombre del mensaje coincida con el de su evento: se propone al elegir el Message Throw. */
  private proponerNombre(eventoThrowId: string): void {
    if (this.mensaje() || !eventoThrowId || this.form.controls.nombre.dirty) {
      return;
    }
    const evento = this.datos().eventos.find((e) => String(e.id) === eventoThrowId);
    if (evento) {
      this.form.controls.nombre.setValue(evento.nombre);
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const numero = (texto: string): number | undefined => (texto ? Number(texto) : undefined);
    const comunes = {
      nombre: v.nombre.trim(),
      contenido: v.contenido.trim(),
      eventoCatchId: numero(v.eventoCatchId),
      claveCorrelacion: v.claveCorrelacion.trim() || undefined,
      tipoDestinoExterno: (v.tipoDestinoExterno || undefined) as TipoDestinoExterno | undefined,
      destinoExterno: v.destinoExterno.trim() || undefined,
      politicaFalloNotificacion: (v.politicaFalloNotificacion || undefined) as PoliticaFalloNotificacion | undefined,
      actividadErrorId: this.derivaAError() ? numero(v.actividadErrorId) : undefined,
      politicaSinCaso: (v.politicaSinCaso || undefined) as PoliticaMensajeSinCaso | undefined
    };
    const actual = this.mensaje();
    this.enviar(
      actual
        ? this.mensajeService.editar(actual.id, comunes)
        : this.mensajeService.crear(this.procesoId(), {
            ...comunes,
            poolOrigenId: Number(v.poolOrigenId),
            poolDestinoId: Number(v.poolDestinoId),
            eventoThrowId: numero(v.eventoThrowId)
          })
    );
  }
}
