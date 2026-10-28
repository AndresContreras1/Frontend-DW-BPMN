// =====================================================================================
// arco-form.component.ts
// Formulario para crear o editar un ARCO (flujo de secuencia: la flecha que une dos nodos del mismo pool).
// Reglas BPMN del backend que refleja en pantalla:
//   - Origen y destino distintos, del MISMO pool, y sin arcos duplicados (entre pools se usan mensajes, no arcos).
//   - La CONDICIÓN solo aplica a arcos que salen de un gateway exclusivo o inclusivo (en el paralelo no hay condiciones).
//   - Es OBLIGATORIA cuando el gateway DIVERGE (menos de 2 arcos entrantes: reparte el flujo); si CONVERGE
//     (2 o más entrantes: junta caminos) es opcional.
// Hereda de FormularioElementoBase. Aquí los validadores del formulario cambian dinámicamente.
// =====================================================================================
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
  /** Servicio HTTP de arcos. */
  private readonly arcoService = inject(ArcoService);

  /** Modelo del diagrama: nodos, gateways y arcos existentes. */
  readonly datos = input.required<DatosDiagrama>();
  /** Arco a editar; null = modo crear. */
  readonly arco = input<ArcoResponse | null>(null);

  /** Lista unificada de nodos (actividades, gateways y eventos) con su etiqueta y pool. */
  readonly nodos = computed(() => listarNodos(this.datos()));
  /** Id del origen elegido, copiado a un signal para que los computed de abajo reaccionen cuando cambie. */
  readonly origenId = signal<number | null>(null);

  /** Opciones del select de origen: todos los nodos. */
  readonly opcionesOrigen = computed<OpcionLista[]>(() => this.nodos().map((n) => ({ valor: String(n.id), etiqueta: n.etiqueta })));

  /** El destino solo ofrece nodos del mismo pool que el origen y distintos a él. */
  readonly opcionesDestino = computed<OpcionLista[]>(() => {
    const origen = this.nodos().find((n) => n.id === this.origenId());
    return this.nodos()
      .filter((n) => n.id !== origen?.id && (!origen || n.poolId === origen.poolId))
      .map((n) => ({ valor: String(n.id), etiqueta: n.etiqueta }));
  });

  /** True si el origen es un gateway NO paralelo (exclusivo o inclusivo): solo ahí tiene sentido la condición. */
  readonly pideCondicion = computed(() => {
    const gateway = this.datos().gateways.find((g) => g.id === this.origenId());
    return gateway !== undefined && gateway.tipoGateway !== 'PARALELO';
  });

  /** El backend exige condición en los arcos que salen de un gateway exclusivo o inclusivo que diverge (menos de 2 arcos entrantes). */
  readonly condicionObligatoria = computed(() => {
    const gateway = this.datos().gateways.find((g) => g.id === this.origenId());
    if (!gateway || gateway.tipoGateway === 'PARALELO') {
      return false;
    }
    return this.datos().arcos.filter((a) => a.destinoId === gateway.id).length < 2;
  });

  /** Formulario tipado. Origen y destino obligatorios (ids como texto del select); etiqueta y condición opcionales por defecto. */
  readonly form = new FormGroup({
    origenId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    destinoId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    etiqueta: new FormControl('', { nonNullable: true }),
    condicion: new FormControl('', { nonNullable: true })
  });

  /** Edición: precarga los campos, sincroniza el signal del origen y ajusta si la condición es obligatoria. */
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
      this.ajustarValidadores();
    }
  }

  /**
   * Se ejecuta al cambiar el origen: actualiza el signal (null si no hay selección válida), reajusta el validador de la
   * condición y, si el destino ya elegido deja de ser válido para el nuevo origen (otro pool), lo limpia.
   */
  alCambiarOrigen(): void {
    const id = Number(this.form.controls.origenId.value);
    this.origenId.set(Number.isNaN(id) || id === 0 ? null : id);
    this.ajustarValidadores();
    const destino = this.form.controls.destinoId.value;
    if (destino && !this.opcionesDestino().some((o) => o.valor === destino)) {
      this.form.controls.destinoId.setValue('');
    }
  }

  /**
   * Validadores dinámicos: la condición pasa a ser required solo si el gateway de origen diverge.
   * Tras cambiar los validadores hay que llamar updateValueAndValidity() para que Angular recalcule la validez.
   */
  private ajustarValidadores(): void {
    const condicion = this.form.controls.condicion;
    condicion.setValidators(this.condicionObligatoria() ? [Validators.required] : []);
    condicion.updateValueAndValidity();
  }

  /** Valida y arma el cuerpo: etiqueta vacía -> undefined; condición solo se envía si el origen es un gateway exclusivo/inclusivo. Crea o edita. */
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
