// Página /compartidos/:id (HU-23): detalle en solo lectura de un proceso compartido por otra empresa.
// Lee el id con ActivatedRoute.snapshot.params y pide el detalle al backend; si la empresa no tiene acceso, el backend rechaza
// y mensajeDeError muestra el motivo.
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ResumenDiagramaComponent } from '../../components/resumen-diagrama/resumen-diagrama.component';
import { VisorProcesoComponent } from '../../components/visor-proceso/visor-proceso.component';
import { SpinnerCargaComponent } from '../../components/spinner-carga/spinner-carga.component';
import { ProcesoCompartidoDetalleResponse } from '../../models/proceso-compartido.model';
import { ProcesoCompartidoService } from '../../service/proceso-compartido.service';
import { mensajeDeError } from '../../utils/problema';

/** HU-23: detalle en SOLO LECTURA de un proceso que otra empresa compartió. */
@Component({
  selector: 'app-compartido-detalle',
  imports: [RouterLink, ResumenDiagramaComponent, SpinnerCargaComponent, VisorProcesoComponent],
  templateUrl: './compartido-detalle.component.html'
})
export class CompartidoDetalleComponent implements OnInit {
  /** Servicio de procesos compartidos. */
  private readonly compartidoService = inject(ProcesoCompartidoService);
  /** Id del proceso tomado de la URL (:id). Los params llegan como texto, por eso Number(...). */
  readonly id = Number(inject(ActivatedRoute).snapshot.params['id']);

  /** Signal con el detalle (proceso + empresa propietaria + modelo); null mientras no llega. */
  readonly detalle = signal<ProcesoCompartidoDetalleResponse | null>(null);
  /** Signal: spinner mientras carga. */
  readonly cargando = signal(true);
  /** Signal con el mensaje si falla la carga. */
  readonly error = signal('');

  /** Dispara la carga del detalle al abrir la página. */
  ngOnInit(): void {
    this.compartidoService.detalle(this.id).subscribe({
      // Éxito: guarda el detalle y oculta el spinner.
      next: (respuesta) => {
        this.detalle.set(respuesta);
        this.cargando.set(false);
      },
      // Fallo (sin acceso, no existe...): muestra el mensaje y la plantilla ofrece volver a la lista.
      error: (e: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(e));
      }
    });
  }
}
