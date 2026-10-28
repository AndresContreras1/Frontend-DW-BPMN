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
  imports: [ReactiveFormsModule, CampoFormularioComponent],
  templateUrl: './compartir-proceso.component.html'
})
export class CompartirProcesoComponent implements OnInit {
  private readonly compartidoService = inject(ProcesoCompartidoService);
  private readonly notificaciones = inject(NotificacionService);

  readonly procesoId = input.required<number>();

  readonly compartidos = signal<ProcesoCompartidoResponse[]>([]);
  readonly error = signal('');
  readonly empresaId = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern('^[0-9]+$')] });

  ngOnInit(): void {
    this.compartidoService.listarDeProceso(this.procesoId()).subscribe({
      next: (lista) => this.compartidos.set(lista),
      error: (e: unknown) => this.error.set(mensajeDeError(e))
    });
  }

  compartir(): void {
    if (this.empresaId.invalid) {
      this.empresaId.markAsTouched();
      return;
    }
    this.error.set('');
    this.compartidoService.compartir(this.procesoId(), { empresaInvitadaId: Number(this.empresaId.value) }).subscribe({
      next: (creado) => {
        this.compartidos.update((lista) => [...lista, creado]);
        this.empresaId.reset('');
        this.notificaciones.exito('Proceso compartido con ' + creado.empresaInvitada + ' (solo lectura).');
      },
      error: (e: unknown) => this.error.set(mensajeDeError(e))
    });
  }

  dejarDeCompartir(compartido: ProcesoCompartidoResponse): void {
    this.compartidoService.dejarDeCompartir(this.procesoId(), compartido.empresaInvitadaId).subscribe({
      next: () => {
        this.compartidos.update((lista) => lista.filter((c) => c.id !== compartido.id));
        this.notificaciones.exito('Se dejó de compartir con ' + compartido.empresaInvitada + '.');
      },
      error: (e: unknown) => this.error.set(mensajeDeError(e))
    });
  }
}
