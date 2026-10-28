// Gestiona con qué empresas se comparte un proceso. Mantiene la lista como signal y la actualiza sin recargar
// (agrega o quita la fila local cuando el backend confirma). Implementa OnInit para cargar los datos al iniciar.
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProcesoCompartidoResponse } from '../../models/proceso-compartido.model';
import { NotificacionService } from '../../service/notificacion.service';
import { ProcesoCompartidoService } from '../../service/proceso-compartido.service';
import { mensajeDeError } from '../../utils/problema';
import { CampoFormularioComponent } from '../campo-formulario/campo-formulario.component';

/** HU-23: la empresa dueña comparte el proceso (solo lectura) con otra empresa. Solo ADMINISTRADOR. */
@Component({
  selector: 'app-compartir-proceso',
  // ReactiveFormsModule por el formulario; CampoFormularioComponent pinta el campo del identificador.
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './compartir-proceso.component.html'
})
export class CompartirProcesoComponent implements OnInit {
  /** Servicio HTTP de procesos compartidos. */
  private readonly compartidoService = inject(ProcesoCompartidoService);
  /** Toasts de confirmación. */
  private readonly notificaciones = inject(NotificacionService);

  /** Id del proceso a compartir (obligatorio, lo pasa el padre). */
  readonly procesoId = input.required<number>();

  /** signal con las empresas que ya tienen acceso; la plantilla se actualiza sola al cambiar. */
  readonly compartidos = signal<ProcesoCompartidoResponse[]>([]);
  /** signal con el mensaje de error general. */
  readonly error = signal('');
  /** FormControl suelto (sin FormGroup) del identificador; requerido y solo dígitos (patrón numérico). */
  readonly empresaId = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern('^[0-9]+$')] });

  /** Hook de ciclo de vida: se ejecuta una vez cuando los inputs ya están disponibles; carga los compartidos actuales. */
  ngOnInit(): void {
    this.compartidoService.listarDeProceso(this.procesoId()).subscribe({
      next: (lista) => this.compartidos.set(lista),
      error: (e: unknown) => this.error.set(mensajeDeError(e))
    });
  }

  /** Valida el id; si es correcto lo envía al backend y agrega la fila devuelta a la lista. */
  compartir(): void {
    if (this.empresaId.invalid) {
      this.empresaId.markAsTouched();
      return;
    }
    this.error.set('');
    // Number(...) convierte el texto del campo al id numérico que espera el backend.
    this.compartidoService.compartir(this.procesoId(), { empresaInvitadaId: Number(this.empresaId.value) }).subscribe({
      next: (creado) => {
        // update + spread: crea un arreglo nuevo (inmutabilidad) para que el signal detecte el cambio.
        this.compartidos.update((lista) => [...lista, creado]);
        this.empresaId.reset('');
        this.notificaciones.exito('Proceso compartido con ' + creado.empresaInvitada + ' (solo lectura).');
      },
      error: (e: unknown) => this.error.set(mensajeDeError(e))
    });
  }

  /** Quita el acceso de la empresa; la fila local se elimina solo si el backend confirma. */
  dejarDeCompartir(compartido: ProcesoCompartidoResponse): void {
    this.compartidoService.dejarDeCompartir(this.procesoId(), compartido.empresaInvitadaId).subscribe({
      next: () => {
        // filter devuelve un arreglo nuevo sin la fila eliminada.
        this.compartidos.update((lista) => lista.filter((c) => c.id !== compartido.id));
        this.notificaciones.exito('Se dejó de compartir con ' + compartido.empresaInvitada + '.');
      },
      error: (e: unknown) => this.error.set(mensajeDeError(e))
    });
  }
}
