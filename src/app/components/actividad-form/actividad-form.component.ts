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
  private readonly actividadService = inject(ActividadService);

  readonly datos = input.required<DatosDiagrama>();
  readonly actividad = input<ActividadResponse | null>(null);
  readonly laneInicial = input<number | undefined>(undefined);
  readonly tipos = TIPOS_ACTIVIDAD;

  readonly opcionesLanes = computed<OpcionLista[]>(() => {
    const lanes: LaneDatos[] = this.datos().lanes;
    return lanes.map((l) => {
      const pool = this.datos().pools.find((p) => p.id === l.poolId);
      return { valor: String(l.id), etiqueta: l.rolProcesoNombre + ' · ' + (pool?.nombre ?? '') };
    });
  });

  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    descripcion: new FormControl('', { nonNullable: true }),
    tipoActividad: new FormControl<string>('TAREA', { nonNullable: true, validators: [Validators.required] }),
    laneId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    posicionX: new FormControl('80', { nonNullable: true, validators: [Validators.required, Validators.pattern('^[0-9]+$')] }),
    posicionY: new FormControl('60', { nonNullable: true, validators: [Validators.required, Validators.pattern('^[0-9]+$')] })
  });

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

  private sugerir(): void {
    const laneId = Number(this.form.controls.laneId.value);
    if (!Number.isNaN(laneId) && laneId > 0) {
      const p = sugerirPosicion(this.datos(), laneId);
      this.form.patchValue({ posicionX: String(p.x), posicionY: String(p.y) });
    }
  }
}
