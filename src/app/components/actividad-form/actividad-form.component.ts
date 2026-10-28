// =====================================================================================
// actividad-form.component.ts
// Formulario para crear o editar una ACTIVIDAD (tarea) BPMN. Reglas del backend que refleja:
//   - El nombre es único dentro del proceso (si se repite, el backend responde error y se muestra en el campo).
//   - Toda actividad vive dentro de una LANE; la lane define el responsable (rol de proceso). Cambiar de lane = cambiar de responsable.
//   - La posición (X, Y) es RELATIVA a la lane (no al lienzo): el diagrama suma el desplazamiento de la lane al dibujar.
// Hereda de FormularioElementoBase (envío, errores, Output guardado/cancelar). Formulario reactivo tipado.
// =====================================================================================
import { Component, computed, inject, input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActividadResponse } from '../../models/actividad.model';
import { OpcionLista, TIPOS_ACTIVIDAD, TipoActividad } from '../../models/enums.model';

import { ActividadService } from '../../service/actividad.service';
import { DatosDiagrama, LaneDatos } from '../../utils/diagrama-layout';
import { sugerirPosicion } from '../../utils/posicion';
import { CampoFormularioComponent } from '../campo-formulario/campo-formulario.component';
import { FormularioElementoBase } from '../formulario-elemento.base';

/**
 * HU-08 a HU-10: crear o editar una actividad (nombre único, tipo, lane responsable).
 * Cambiar la lane equivale a cambiar el responsable de la actividad.
 */
@Component({
  selector: 'app-actividad-form',
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './actividad-form.component.html'
})
export class ActividadFormComponent extends FormularioElementoBase<ActividadResponse> implements OnInit {
  /** Servicio HTTP de actividades. */
  private readonly actividadService = inject(ActividadService);

  /** Modelo completo del diagrama: da las lanes disponibles y permite sugerir una posición libre. */
  readonly datos = input.required<DatosDiagrama>();
  /** Actividad a editar; null = modo crear. */
  readonly actividad = input<ActividadResponse | null>(null);
  /** Lane preseleccionada al crear (p. ej. la que el usuario eligió en el diagrama). */
  readonly laneInicial = input<number | undefined>(undefined);
  /** Catálogo de tipos de actividad para el select. */
  readonly tipos = TIPOS_ACTIVIDAD;

  /** Opciones del select de lane: "Rol · Pool" para distinguir lanes con el mismo rol en pools distintos. */
  readonly opcionesLanes = computed<OpcionLista[]>(() => {
    const lanes: LaneDatos[] = this.datos().lanes;
    return lanes.map((l) => {
      const pool = this.datos().pools.find((p) => p.id === l.poolId);
      return { valor: String(l.id), etiqueta: l.rolProcesoNombre + ' · ' + (pool?.nombre ?? '') };
    });
  });

  /**
   * Formulario tipado. Los números van como string porque son campos de texto; Validators.pattern('^[0-9]+$')
   * exige enteros no negativos y se convierten con Number() al guardar. Valores por defecto de posición: 80, 60.
   */
  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    descripcion: new FormControl('', { nonNullable: true }),
    tipoActividad: new FormControl<string>('TAREA', { nonNullable: true, validators: [Validators.required] }),
    laneId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    posicionX: new FormControl('80', { nonNullable: true, validators: [Validators.required, Validators.pattern('^[0-9]+$')] }),
    posicionY: new FormControl('60', { nonNullable: true, validators: [Validators.required, Validators.pattern('^[0-9]+$')] })
  });

  /**
   * Edición: precarga todos los campos y termina (return). Creación: elige la lane inicial (la indicada o la primera)
   * y propone una posición libre dentro de ella.
   */
  ngOnInit(): void {
    const actual = this.actividad();
    if (actual) {
      this.form.setValue({
        nombre: actual.nombre,
        descripcion: actual.descripcion ?? '',
        tipoActividad: actual.tipoActividad,
        laneId: String(actual.laneId),
        posicionX: String(actual.posicionX),
        posicionY: String(actual.posicionY)
      });
      return;
    }
    const laneId = this.laneInicial() ?? this.datos().lanes[0]?.id;
    if (laneId !== undefined) {
      this.form.controls.laneId.setValue(String(laneId));
      this.sugerir();
    }
  }

  /** Al crear, si cambia la lane se propone una posición libre dentro de ella. */
  alCambiarLane(): void {
    if (!this.actividad()) {
      this.sugerir();
    }
  }

  /** Valida, arma el cuerpo (descripción vacía se envía como undefined) y crea (en la lane elegida) o edita. */
  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos = {
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim() || undefined,
      tipoActividad: v.tipoActividad as TipoActividad,
      posicionX: Number(v.posicionX),
      posicionY: Number(v.posicionY),
      laneId: Number(v.laneId)
    };
    const actual = this.actividad();
    this.enviar(actual ? this.actividadService.editar(actual.id, datos) : this.actividadService.crear(datos.laneId, datos));
  }

  /** Calcula una posición libre en la lane elegida (utilidad sugerirPosicion) y la vuelca al formulario con patchValue (actualiza solo esos campos). */
  private sugerir(): void {
    const laneId = Number(this.form.controls.laneId.value);
    if (!Number.isNaN(laneId) && laneId > 0) {
      const p = sugerirPosicion(this.datos(), laneId);
      this.form.patchValue({ posicionX: String(p.x), posicionY: String(p.y) });
    }
  }
}
