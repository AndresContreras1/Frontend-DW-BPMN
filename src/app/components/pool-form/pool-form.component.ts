// =====================================================================================
// pool-form.component.ts
// Formulario para crear o editar un POOL (participante del proceso BPMN).
// HERENCIA DE FORMULARIOS: extiende FormularioElementoBase, que ya trae el estado de envío (`enviando`),
// el error general (`error`), los errores por campo del backend (`erroresServidor`), los Output `guardado` y
// `cancelar` y el método protegido `enviar()`. Este componente solo define sus campos y arma su petición HTTP.
// FORMULARIO REACTIVO TIPADO: FormGroup/FormControl con tipo explícito, así `getRawValue()` devuelve tipos exactos.
// =====================================================================================
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
  /** Servicio HTTP de pools, obtenido con inject() (alternativa moderna al constructor). */
  private readonly poolService = inject(PoolService);

  /** Proceso al que pertenece el pool; se necesita para crear (el POST cuelga de /procesos/{id}/pools). */
  readonly procesoId = input.required<number>();
  /** Pool a editar; si es null el formulario funciona en modo "crear". */
  readonly pool = input<PoolResponse | null>(null);
  /** Opciones del select de tipo de participante (catálogo fijo del enum). */
  readonly tipos = TIPOS_PARTICIPANTE;

  /**
   * Formulario reactivo tipado. nonNullable: true hace que reset/valor nunca sea null (el tipo es string, no string | null).
   * Campos: nombre (obligatorio), tipo de participante (EMPRESA por defecto) y bandera de caja negra.
   */
  readonly form = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tipoParticipante: new FormControl<string>('EMPRESA', { nonNullable: true, validators: [Validators.required] }),
    cajaNegra: new FormControl(false, { nonNullable: true })
  });

  /**
   * Los inputs ya están disponibles en ngOnInit (no en el constructor). Si llegó un pool se
   * precarga el formulario con setValue (exige todos los campos), pasando a modo edición.
   */
  ngOnInit(): void {
    const actual = this.pool();
    if (actual) {
      this.form.setValue({ nombre: actual.nombre, tipoParticipante: actual.tipoParticipante, cajaNegra: actual.cajaNegra });
    }
  }

  /**
   * Envía el formulario. Si es inválido marca todos los campos como tocados (para que se vean los errores) y corta.
   * Si es válido arma el cuerpo (nombre sin espacios sobrantes; el tipo se afirma como TipoParticipante porque el
   * select solo ofrece valores del enum) y decide: con pool existente EDITA, sin pool CREA. El resultado/error lo gestiona `enviar()` del padre.
   */
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
