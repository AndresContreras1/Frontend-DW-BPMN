import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ResumenDiagramaComponent } from '../../components/resumen-diagrama/resumen-diagrama.component';
import { SpinnerCargaComponent } from '../../components/spinner-carga/spinner-carga.component';
import { ProcesoCompartidoDetalleResponse } from '../../models/proceso-compartido.model';
import { ProcesoCompartidoService } from '../../service/proceso-compartido.service';
import { mensajeDeError } from '../../utils/problema';

/** HU-23: detalle en SOLO LECTURA de un proceso que otra empresa compartió. */
@Component({
  selector: 'app-compartido-detalle',
  imports: [RouterLink, ResumenDiagramaComponent, SpinnerCargaComponent],
  templateUrl: './compartido-detalle.component.html'
})
export class CompartidoDetalleComponent implements OnInit {
  private readonly compartidoService = inject(ProcesoCompartidoService);
  readonly id = Number(inject(ActivatedRoute).snapshot.params['id']);

  readonly detalle = signal<ProcesoCompartidoDetalleResponse | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.compartidoService.detalle(this.id).subscribe({
      next: (respuesta) => {
        this.detalle.set(respuesta);
        this.cargando.set(false);
      },
      error: (e: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(e));
      }
    });
  }
}
