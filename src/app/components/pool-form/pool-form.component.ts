import { Component, inject, input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TIPOS_PARTICIPANTE, TipoParticipante } from '../../models/enums.model';
import { PoolResponse } from '../../models/pool.model';
import { PoolService } from '../../service/pool.service';
import { CampoFormularioComponent } from '../campo-formulario/campo-formulario.component';
import { FormularioElementoBase } from '../formulario-elemento.base';

/**
 * HU-21: crear o editar un pool. Un pool de la empresa lleva lanes; un pool externo
 * (cliente, proveedor, sistema externo) puede ser caja negra: rectángulo sin lanes.
 */
@Component({
  selector: 'app-pool-form',
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './pool-form.component.html'
})
export class PoolFormComponent extends FormularioElementoBase<PoolResponse> implements OnInit {
  private readonly poolService = inject(PoolService);

  readonly procesoId = input.required<number>();
  readonly pool = input<PoolResponse | null>(null);
  readonly tipos = TIPOS_PARTICIPANTE;

  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipoParticipante: new FormControl<string>('EMPRESA', { nonNullable: true, validators: [Validators.required] }),
    cajaNegra: new FormControl(false, { nonNullable: true })
  });

  ngOnInit(): void {
    const actual = this.pool();
    if (actual) {
      this.form.setValue({ nombre: actual.nombre, tipoParticipante: actual.tipoParticipante, cajaNegra: actual.cajaNegra });
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos = { nombre: v.nombre.trim(), tipoParticipante: v.tipoParticipante as TipoParticipante, cajaNegra: v.cajaNegra };
    const actual = this.pool();
    this.enviar(actual ? this.poolService.editar(actual.id, datos) : this.poolService.crear(this.procesoId(), datos));
  }
}
