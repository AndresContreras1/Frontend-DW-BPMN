import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ArcoResponse } from '../../models/arco.model';
import { OpcionLista } from '../../models/enums.model';
import { ArcoService } from '../../service/arco.service';
import { DatosDiagrama } from '../../utils/diagrama-layout';
import { listarNodos } from '../../utils/nodos';
import { CampoFormularioComponent } from '../campo-formulario/campo-formulario.component';
import { FormularioElementoBase } from '../formulario-elemento.base';

/**
 * HU-11, HU-12 y HU-15: crear o editar un arco (flujo de secuencia entre dos nodos).
 * Reglas que valida el backend: origen y destino distintos, mismo pool y sin arcos duplicados.
 * La condición se pide solo cuando el arco sale de un gateway exclusivo o inclusivo.
 */
@Component({
  selector: 'app-arco-form',
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './arco-form.component.html'
})
export class ArcoFormComponent extends FormularioElementoBase<ArcoResponse> implements OnInit {
  private readonly arcoService = inject(ArcoService);

  readonly datos = input.required<DatosDiagrama>();
  readonly arco = input<ArcoResponse | null>(null);

  readonly nodos = computed(() => listarNodos(this.datos()));
  readonly origenId = signal<number | null>(null);

  readonly opcionesOrigen = computed<OpcionLista[]>(() => this.nodos().map((n) => ({ valor: String(n.id), etiqueta: n.etiqueta })));

  /** El destino solo ofrece nodos del mismo pool que el origen y distintos a él. */
  readonly opcionesDestino = computed<OpcionLista[]>(() => {
    const origen = this.nodos().find((n) => n.id === this.origenId());
    return this.nodos()
      .filter((n) => n.id !== origen?.id && (!origen || n.poolId === origen.poolId))
      .map((n) => ({ valor: String(n.id), etiqueta: n.etiqueta }));
  });

  readonly pideCondicion = computed(() => {
    const gateway = this.datos().gateways.find((g) => g.id === this.origenId());
    return gateway !== undefined && gateway.tipoGateway !== 'PARALELO';
  });

  readonly form = new FormGroup({
    origenId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    destinoId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    etiqueta: new FormControl('', { nonNullable: true }),
    condicion: new FormControl('', { nonNullable: true })
  });

  ngOnInit(): void {
    const actual = this.arco();
    if (actual) {
      this.form.setValue({
        origenId: String(actual.origenId),
        destinoId: String(actual.destinoId),
        etiqueta: actual.etiqueta ?? '',
        condicion: actual.condicion ?? ''
      });
      this.origenId.set(actual.origenId);
    }
  }

  alCambiarOrigen(): void {
    const id = Number(this.form.controls.origenId.value);
    this.origenId.set(Number.isNaN(id) || id === 0 ? null : id);
    const destino = this.form.controls.destinoId.value;
    if (destino && !this.opcionesDestino().some((o) => o.valor === destino)) {
      this.form.controls.destinoId.setValue('');
    }
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos = {
      origenId: Number(v.origenId),
      destinoId: Number(v.destinoId),
      etiqueta: v.etiqueta.trim() || undefined,
      condicion: this.pideCondicion() ? v.condicion.trim() || undefined : undefined
    };
    const actual = this.arco();
    this.enviar(actual ? this.arcoService.editar(actual.id, datos) : this.arcoService.crear(datos));
  }
}
