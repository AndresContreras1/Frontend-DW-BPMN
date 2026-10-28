import { Component, computed, inject, input, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OpcionLista, TIPOS_GATEWAY, TipoGateway } from '../../models/enums.model';
import { GatewayResponse } from '../../models/gateway.model';
import { GatewayService } from '../../service/gateway.service';
import { DatosDiagrama } from '../../utils/diagrama-layout';
import { sugerirPosicion } from '../../utils/posicion';
import { CampoFormularioComponent } from '../campo-formulario/campo-formulario.component';
import { FormularioElementoBase } from '../formulario-elemento.base';

/**
 * HU-14 a HU-16: crear o editar un gateway (exclusivo, paralelo o inclusivo).
 * Las condiciones se definen en los arcos salientes; al pasar a paralelo el backend las limpia.
 */
@Component({
  selector: 'app-gateway-form',
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './gateway-form.component.html'
})
export class GatewayFormComponent extends FormularioElementoBase<GatewayResponse> implements OnInit {
  private readonly gatewayService = inject(GatewayService);

  readonly datos = input.required<DatosDiagrama>();
  readonly gateway = input<GatewayResponse | null>(null);
  readonly laneInicial = input<number | undefined>(undefined);
  readonly tipos = TIPOS_GATEWAY;

  readonly opcionesLanes = computed<OpcionLista[]>(() =>
    this.datos().lanes.map((l) => ({
      valor: String(l.id),
      etiqueta: l.rolProcesoNombre + ' · ' + (this.datos().pools.find((p) => p.id === l.poolId)?.nombre ?? '')
    }))
  );

  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipoGateway: new FormControl<string>('EXCLUSIVO', { nonNullable: true, validators: [Validators.required] }),
    laneId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    posicionX: new FormControl('80', { nonNullable: true, validators: [Validators.required, Validators.pattern('^[0-9]+$')] }),
    posicionY: new FormControl('60', { nonNullable: true, validators: [Validators.required, Validators.pattern('^[0-9]+$')] })
  });

  /** Aviso cuando un gateway que tenía condiciones pasa a paralelo. */
  avisaLimpiezaDeCondiciones(): boolean {
    const actual = this.gateway();
    return actual !== null && actual.tipoGateway !== 'PARALELO' && this.form.controls.tipoGateway.value === 'PARALELO';
  }

  ngOnInit(): void {
    const actual = this.gateway();
    if (actual) {
      this.form.setValue({
        nombre: actual.nombre,
        tipoGateway: actual.tipoGateway,
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

  alCambiarLane(): void {
    if (!this.gateway()) {
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
      tipoGateway: v.tipoGateway as TipoGateway,
      posicionX: Number(v.posicionX),
      posicionY: Number(v.posicionY),
      laneId: Number(v.laneId)
    };
    const actual = this.gateway();
    this.enviar(actual ? this.gatewayService.editar(actual.id, datos) : this.gatewayService.crear(Number(v.laneId), datos));
  }

  private sugerir(): void {
    const laneId = Number(this.form.controls.laneId.value);
    if (!Number.isNaN(laneId) && laneId > 0) {
      const p = sugerirPosicion(this.datos(), laneId);
      this.form.patchValue({ posicionX: String(p.x), posicionY: String(p.y) });
    }
  }
}
