import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { CompartirProcesoComponent } from '../../components/compartir-proceso/compartir-proceso.component';
import { EstadoProcesoComponent } from '../../components/estado-proceso/estado-proceso.component';
import { ResumenDiagramaComponent } from '../../components/resumen-diagrama/resumen-diagrama.component';
import { VisorProcesoComponent } from '../../components/visor-proceso/visor-proceso.component';
import { SpinnerCargaComponent } from '../../components/spinner-carga/spinner-carga.component';
import { HistorialCambioResponse, ProcesoDiagramaResponse, ProcesoResponse } from '../../models/proceso.model';
import { AuthService } from '../../service/auth.service';
import { ProcesoService } from '../../service/proceso.service';
import { mensajeDeError } from '../../utils/problema';

/** HU-07: detalle del proceso con su modelo, estado e historial de cambios. */
@Component({
  selector: 'app-proceso-detalle',
  imports: [
    DatePipe,
    RouterLink,
    CompartirProcesoComponent,
    EstadoProcesoComponent,
    ResumenDiagramaComponent,
    SpinnerCargaComponent,
    VisorProcesoComponent
  ],
  templateUrl: './proceso-detalle.component.html'
})
export class ProcesoDetalleComponent implements OnInit {
  private readonly procesoService = inject(ProcesoService);
  readonly auth = inject(AuthService);
  readonly id = Number(inject(ActivatedRoute).snapshot.params['id']);

  readonly proceso = signal<ProcesoResponse | null>(null);
  readonly historial = signal<HistorialCambioResponse[]>([]);
  readonly diagrama = signal<ProcesoDiagramaResponse | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.procesoService
      .obtener(this.id)
      .pipe(
        switchMap((detalle) => {
          this.proceso.set(detalle.proceso);
          this.historial.set(detalle.historial);
          return this.procesoService.diagrama(this.id);
        })
      )
      .subscribe({
        next: (diagrama) => {
          this.diagrama.set(diagrama);
          this.cargando.set(false);
        },
        error: (e: unknown) => {
          this.cargando.set(false);
          this.error.set(mensajeDeError(e));
        }
      });
  }

  alCambiarEstado(actualizado: ProcesoResponse): void {
    this.proceso.set(actualizado);
    this.procesoService.historial(this.id).subscribe({
      next: (lista) => this.historial.set(lista),
      error: () => undefined
    });
  }
}
