// Página /procesos/:id (HU-07): detalle de un proceso con su modelo (diagrama), estado e historial de cambios. Protegida con authGuard.
// Conceptos:
// - ActivatedRoute.snapshot.params["id"] para leer el id de la URL.
// - switchMap: encadena dos peticiones DEPENDIENTES (primero el detalle, luego el diagrama) en un solo flujo con un único next/error.
// - Roles de acceso: puedeEditar() y esAdministrador() deciden qué botones y qué sección (compartir) se muestran.
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
/** Página de detalle. El estado vive en signals; los permisos vienen de AuthService. */
export class ProcesoDetalleComponent implements OnInit {
  /** Servicio HTTP de procesos (obtener, diagrama, historial). */
  private readonly procesoService = inject(ProcesoService);
  /** Público para usar los roles de acceso en la plantilla. */
  readonly auth = inject(AuthService);
  /** Id del proceso leído de la URL; los params son texto, por eso Number(...). */
  readonly id = Number(inject(ActivatedRoute).snapshot.params['id']);

  /** Datos básicos del proceso (nombre, estado, activo...). */
  readonly proceso = signal<ProcesoResponse | null>(null);
  /** Lista del historial de cambios (fecha, autor, descripción). */
  readonly historial = signal<HistorialCambioResponse[]>([]);
  /** Modelo BPMN del proceso (pools, lanes, actividades, arcos...) para el resumen y el visor. */
  readonly diagrama = signal<ProcesoDiagramaResponse | null>(null);
  /** Signal: spinner hasta que terminen ambas peticiones. */
  readonly cargando = signal(true);
  /** Signal con el mensaje si cualquiera de las peticiones falla. */
  readonly error = signal('');

  /**
   * Carga en cadena: obtener(id) trae proceso + historial; con switchMap, cuando llega, se pide el diagrama.
   * Si la primera falla (p. ej. 404 no existe o 403 de otra empresa) la segunda no se ejecuta y se va directo a error.
   */
  ngOnInit(): void {
    this.procesoService
      .obtener(this.id)
      .pipe(
        // Guarda lo recibido de la primera petición y devuelve la segunda; el next de abajo recibe el resultado de ESTA (el diagrama).
        switchMap((detalle) => {
          this.proceso.set(detalle.proceso);
          this.historial.set(detalle.historial);
          return this.procesoService.diagrama(this.id);
        })
      )
      .subscribe({
        // Éxito de la cadena completa: guarda el diagrama y apaga el spinner.
        next: (diagrama) => {
          this.diagrama.set(diagrama);
          this.cargando.set(false);
        },
        // Fallo de cualquiera de las dos peticiones: muestra el mensaje y la plantilla ofrece volver a la lista.
        error: (e: unknown) => {
          this.cargando.set(false);
          this.error.set(mensajeDeError(e));
        }
      });
  }

  /**
   * Handler del evento (cambiado) del componente de estado: el backend ya confirmó el cambio (pesimista), así que se actualiza el proceso mostrado
   * y se recarga el historial, porque cambiar de estado genera una entrada nueva.
   */
  alCambiarEstado(actualizado: ProcesoResponse): void {
    this.proceso.set(actualizado);
    this.procesoService.historial(this.id).subscribe({
      next: (lista) => this.historial.set(lista),
      // Si falla solo el refresco del historial se ignora: el cambio de estado ya se aplicó y no hay que molestar al usuario.
      error: () => undefined
    });
  }
}
