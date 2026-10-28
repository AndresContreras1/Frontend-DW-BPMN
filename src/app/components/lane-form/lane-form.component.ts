// =====================================================================================
// lane-form.component.ts
// Formulario para crear o editar una LANE (calle de un pool). En BPMN una lane agrupa las tareas de un
// responsable; aquí ese responsable es un ROL DE PROCESO del catálogo (no una persona).
// Hereda de FormularioElementoBase (estado de envío, errores del backend, Output guardado/cancelar, método enviar()).
// =====================================================================================
import { Component, computed, inject, input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OpcionLista } from '../../models/enums.model';
import { LaneResponse } from '../../models/lane.model';
import { RolProcesoVistaResponse } from '../../models/rol-proceso.model';
import { LaneService } from '../../service/lane.service';
import { CampoFormularioComponent } from '../campo-formulario/campo-formulario.component';
import { FormularioElementoBase } from '../formulario-elemento.base';

/** HU-22: crear o editar una lane; su responsable es un rol de proceso del catálogo. */
@Component({
  selector: 'app-lane-form',
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './lane-form.component.html'
})
export class LaneFormComponent extends FormularioElementoBase<LaneResponse> implements OnInit {
  /** Servicio HTTP de lanes. */
  private readonly laneService = inject(LaneService);

  /** Pool que contendrá la lane (el POST cuelga de /pools/{id}/lanes). */
  readonly poolId = input.required<number>();
  /** Lane a editar; null = modo crear. */
  readonly lane = input<LaneResponse | null>(null);
  /** Catálogo de roles de proceso disponibles para asignar como responsable. */
  readonly roles = input.required<RolProcesoVistaResponse[]>();

  /** Convierte los roles al formato de opciones del select (valor texto = id, etiqueta = nombre). Se recalcula si cambian los roles. */
  readonly opcionesRoles = computed<OpcionLista[]>(() => this.roles().map((r) => ({ valor: String(r.id), etiqueta: r.nombre })));

  /** Formulario tipado: nombre obligatorio y rol obligatorio (el id va como texto porque un <select> maneja strings). */
  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rolProcesoId: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  /**
   * Modo edición: precarga nombre y rol. Modo creación: si hay roles, preselecciona el primero
   * para que el select no quede vacío.
   */
  ngOnInit(): void {
    const actual = this.lane();
    if (actual) {
      this.form.setValue({ nombre: actual.nombre, rolProcesoId: String(actual.rolProcesoId) });
    } else if (this.roles().length > 0) {
      this.form.controls.rolProcesoId.setValue(String(this.roles()[0].id));
    }
  }

  /** Valida, arma el cuerpo (id del rol convertido de vuelta a número) y crea o edita según haya lane existente. */
  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos = { nombre: v.nombre.trim(), rolProcesoId: Number(v.rolProcesoId) };
    const actual = this.lane();
    this.enviar(actual ? this.laneService.editar(actual.id, datos) : this.laneService.crear(this.poolId(), datos));
  }
}
