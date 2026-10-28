// =====================================================================================
// evento-form.component.ts
// Formulario para crear o editar un EVENTO DE MENSAJE BPMN. Es el punto por donde un pool se comunica con otro:
//   - THROW (envía): sobre relleno. Emite un mensaje hacia otro pool.
//   - CATCH_INICIO (recibe y arranca): al llegar el mensaje, el proceso comienza.
//   - CATCH_INTERMEDIO (recibe a mitad): el flujo espera un mensaje antes de continuar.
// Reglas que refleja: la clave de correlación es obligatoria (identifica a qué caso pertenece el mensaje) y solo un
// CATCH puede indicar las actividades que usan los datos del mensaje. El sistema solo MODELA: no envía mensajes reales.
// Hereda de FormularioElementoBase. La posición es relativa a la lane.
// =====================================================================================
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
  /** Servicio HTTP de eventos de mensaje. */
  private readonly eventoService = inject(EventoMensajeService);

  /** Modelo del diagrama: lanes y actividades disponibles. */
  readonly datos = input.required<DatosDiagrama>();
  /** Evento a editar; null = modo crear. */
  readonly evento = input<EventoMensajeResponse | null>(null);
  /** Lane preseleccionada al crear. */
  readonly laneInicial = input<number | undefined>(undefined);
  /** Catálogo de tipos de evento (THROW, CATCH_INICIO, CATCH_INTERMEDIO) para el select. */
  readonly tipos = TIPOS_EVENTO_MENSAJE;

  /** Opciones del select de lane con el formato "Rol · Pool". */
  readonly opcionesLanes = computed<OpcionLista[]>(() =>
    this.datos().lanes.map((l) => ({
      valor: String(l.id),
      etiqueta: l.rolProcesoNombre + ' · ' + (this.datos().pools.find((p) => p.id === l.poolId)?.nombre ?? '')
    }))
  );

  /**
   * Ids de las actividades marcadas como "usan los datos del mensaje". Está en un signal y no en el FormGroup
   * porque es una selección múltiple de casillas que no corresponde a un solo control.
   */
  readonly actividadIds = signal<number[]>([]);
  /** True cuando el tipo elegido es un CATCH (recibe); controla si se muestra la lista de actividades. */
  readonly esCatch = signal(false);

  /** Actividades del proceso reducidas a id + nombre, para pintar las casillas. */
  readonly actividades = computed(() =>
    this.datos().actividades.map((a) => ({ id: a.id, nombre: a.nombre }))
  );

  /** Formulario reactivo tipado. Contenido y clave de correlación son obligatorios; origenExterno marca que el mensaje viene de otro participante. */
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

  /** Edición: precarga campos, actividades asociadas y estado esCatch. Creación: lane inicial y posición libre sugerida. */
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

  /** Marca o desmarca una actividad: si el id ya está lo quita, si no lo agrega (update crea un arreglo nuevo, sin mutar el anterior). */
  alternarActividad(id: number): void {
    this.actividadIds.update((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  /** Al crear, si cambia la lane se sugiere posición libre en ella. */
  alCambiarLane(): void {
    if (!this.evento()) {
      this.sugerir();
    }
  }

  /** Valida, arma el cuerpo (actividadIds solo viaja si es CATCH) y crea o edita. */
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

  /** Propone una posición libre dentro de la lane elegida y la escribe en el formulario. */
  private sugerir(): void {
    const laneId = Number(this.form.controls.laneId.value);
    if (!Number.isNaN(laneId) && laneId > 0) {
      const p = sugerirPosicion(this.datos(), laneId);
      this.form.patchValue({ posicionX: String(p.x), posicionY: String(p.y) });
    }
  }
}
