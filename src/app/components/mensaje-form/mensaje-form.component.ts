// =====================================================================================
// mensaje-form.component.ts
// Formulario para crear o editar un MENSAJE entre dos pools (línea punteada en el diagrama).
// Reglas BPMN del backend que refleja:
//   - Un mensaje conecta pools DISTINTOS y se asocia a un evento Message THROW del pool de origen (quien envía) y a un
//     evento Message CATCH del pool de destino (quien recibe), o bien a un DESTINO EXTERNO (correo, servicio web o cola)
//     cuando el destino es un sistema externo de CAJA NEGRA (pool sin detalle interno).
//   - El nombre del mensaje debe coincidir con el del evento THROW (por eso se propone automáticamente).
//   - CORRELACIÓN: la clave que une el mensaje con su caso; si se deja vacía hereda la del THROW.
//   - Políticas: qué hacer si falla la notificación externa (puede derivar a una actividad de error) y qué hacer si el
//     mensaje llega sin un caso abierto.
// El sistema solo MODELA; nunca envía nada. Hereda de FormularioElementoBase.
// =====================================================================================
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

/** Opción vacía que se antepone a los selects opcionales (valor '' = sin selección). */
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
  /** Servicio HTTP de mensajes. */
  private readonly mensajeService = inject(MensajeService);

  /** Proceso al que pertenece el mensaje (se usa para crear). */
  readonly procesoId = input.required<number>();
  /** Modelo del diagrama: pools, lanes, eventos y actividades. */
  readonly datos = input.required<DatosDiagrama>();
  /** Mensaje a editar; null = modo crear. */
  readonly mensaje = input<MensajeResponse | null>(null);

  /** Opciones de los selects opcionales: siempre incluyen "Ninguno" al inicio. */
  readonly tiposDestino: OpcionLista[] = [NINGUNO, ...TIPOS_DESTINO_EXTERNO];
  readonly politicasFallo: OpcionLista[] = [NINGUNO, ...POLITICAS_FALLO];
  readonly politicasSinCaso: OpcionLista[] = [NINGUNO, ...POLITICAS_SIN_CASO];

  /**
   * Signals "espejo" de valores del formulario. Se copian aquí porque los computed de abajo solo reaccionan a signals
   * (un FormControl no es un signal); así las listas de eventos se recalculan al cambiar el pool.
   */
  private readonly poolOrigen = signal<number | null>(null);
  private readonly poolDestino = signal<number | null>(null);
  /** True si la política de fallo es derivar a una actividad de error (entonces se pide esa actividad). */
  readonly derivaAError = signal(false);
  /** True si se eligió un tipo de destino externo (se muestran los campos de notificación). */
  readonly conDestinoExterno = signal(false);
  /** True si ya se eligió un Message Throw; mientras no, el resto de opciones permanece oculto. */
  readonly conThrow = signal(false);

  /** Opciones de pools (para origen y destino). */
  readonly opcionesPools = computed<OpcionLista[]>(() => this.datos().pools.map((p) => ({ valor: String(p.id), etiqueta: p.nombre })));

  /** Conjunto de ids de las lanes de un pool; sirve para saber a qué pool pertenece un evento (los eventos cuelgan de lanes). */
  private lanesDe(poolId: number | null): Set<number> {
    return new Set(this.datos().lanes.filter((l) => l.poolId === poolId).map((l) => l.id));
  }

  /** Eventos THROW (emisores) que están en lanes del pool de origen. */
  readonly opcionesThrow = computed<OpcionLista[]>(() => {
    const lanes = this.lanesDe(this.poolOrigen());
    return [NINGUNO, ...this.datos().eventos.filter((e) => e.tipoEvento === 'THROW' && lanes.has(e.laneId)).map((e) => ({ valor: String(e.id), etiqueta: e.nombre }))];
  });

  /** Eventos CATCH (receptores, inicio o intermedio: todo lo que no es THROW) en lanes del pool de destino. */
  readonly opcionesCatch = computed<OpcionLista[]>(() => {
    const lanes = this.lanesDe(this.poolDestino());
    return [NINGUNO, ...this.datos().eventos.filter((e) => e.tipoEvento !== 'THROW' && lanes.has(e.laneId)).map((e) => ({ valor: String(e.id), etiqueta: e.nombre }))];
  });

  /** Actividades del pool de origen que pueden usarse como actividad de error. */
  readonly opcionesActividadError = computed<OpcionLista[]>(() => {
    const lanes = this.lanesDe(this.poolOrigen());
    return [NINGUNO, ...this.datos().actividades.filter((a) => lanes.has(a.laneId)).map((a) => ({ valor: String(a.id), etiqueta: a.nombre }))];
  });

  /** Formulario tipado. Obligatorios: nombre, contenido y los dos pools. Los ids van como texto ('' = sin valor); destinoExterno limitado a 200 caracteres. */
  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contenido: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    poolOrigenId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    poolDestinoId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    eventoThrowId: new FormControl('', { nonNullable: true }),
    eventoCatchId: new FormControl('', { nonNullable: true }),
    claveCorrelacion: new FormControl('', { nonNullable: true }),
    tipoDestinoExterno: new FormControl('', { nonNullable: true }),
    destinoExterno: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    politicaFalloNotificacion: new FormControl('', { nonNullable: true }),
    actividadErrorId: new FormControl('', { nonNullable: true }),
    politicaSinCaso: new FormControl('', { nonNullable: true })
  });

  /**
   * Edición: precarga todo y DESHABILITA pools de origen/destino y el THROW (no se pueden cambiar tras crear el mensaje;
   * getRawValue() igual los devuelve). Creación: propone como origen el primer pool y como destino el segundo.
   * Al final sincroniza los signals espejo con actualizarDependencias().
   */
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
    this.conThrow.set(v.eventoThrowId !== '');
    // Si el THROW elegido ya no pertenece al pool de origen (el usuario cambió de pool), se limpia.
    if (v.eventoThrowId && !this.opcionesThrow().some((o) => o.valor === v.eventoThrowId)) {
      this.form.controls.eventoThrowId.setValue('');
    }
    this.proponerNombre(v.eventoThrowId);
    // Lo mismo con el CATCH respecto al pool de destino.
    if (v.eventoCatchId && !this.opcionesCatch().some((o) => o.valor === v.eventoCatchId)) {
      this.form.controls.eventoCatchId.setValue('');
    }
  }

  /** El backend exige que el nombre del mensaje coincida con el de su evento: se propone al elegir el Message Throw. */
  private proponerNombre(eventoThrowId: string): void {
    // No se propone al editar, si no hay THROW, ni si el usuario ya escribió el nombre a mano (dirty).
    if (this.mensaje() || !eventoThrowId || this.form.controls.nombre.dirty) {
      return;
    }
    const evento = this.datos().eventos.find((e) => String(e.id) === eventoThrowId);
    if (evento) {
      this.form.controls.nombre.setValue(evento.nombre);
    }
  }

  /**
   * Valida y arma el cuerpo. `numero` convierte texto a número (o undefined si está vacío). `comunes` son los campos
   * que se pueden editar; al CREAR se agregan además pools y THROW, que no cambian después. Los valores vacíos se
   * envían como undefined para que no viajen al backend. La actividad de error solo va si la política es derivar a error.
   */
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
