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
  private readonly laneService = inject(LaneService);

  readonly poolId = input.required<number>();
  readonly lane = input<LaneResponse | null>(null);
  readonly roles = input.required<RolProcesoVistaResponse[]>();

  readonly opcionesRoles = computed<OpcionLista[]>(() => this.roles().map((r) => ({ valor: String(r.id), etiqueta: r.nombre })));

  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    rolProcesoId: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  ngOnInit(): void {
    const actual = this.lane();
    if (actual) {
      this.form.setValue({ nombre: actual.nombre, rolProcesoId: String(actual.rolProcesoId) });
    } else if (this.roles().length > 0) {
      this.form.controls.rolProcesoId.setValue(String(this.roles()[0].id));
    }
  }

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
