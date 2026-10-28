// Página /compartidos (HU-23): lista de procesos que OTRAS empresas compartieron con la mía. Es solo lectura.
// Protegida con authGuard (cualquier usuario autenticado). Carga la lista una vez en ngOnInit.
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EstadoVacioComponent } from '../../components/estado-vacio/estado-vacio.component';
import { SpinnerCargaComponent } from '../../components/spinner-carga/spinner-carga.component';
import { ProcesoCompartidoResponse } from '../../models/proceso-compartido.model';
import { ProcesoCompartidoService } from '../../service/proceso-compartido.service';
import { mensajeDeError } from '../../utils/problema';

/** HU-23: procesos que otras empresas compartieron con la mía (solo lectura). */
@Component({
  selector: 'app-compartidos',
  imports: [RouterLink, EstadoVacioComponent, SpinnerCargaComponent],
  templateUrl: './compartidos.component.html'
})
export class CompartidosComponent implements OnInit {
  /** Servicio que consulta al backend los procesos compartidos hacia mi empresa. */
  private readonly compartidoService = inject(ProcesoCompartidoService);

  /** Signal con la lista recibida; la plantilla la recorre con @for. */
  readonly compartidos = signal<ProcesoCompartidoResponse[]>([]);
  /** Signal: true hasta que llega la respuesta (muestra el spinner). */
  readonly cargando = signal(true);
  /** Signal con el mensaje de error de la carga. */
  readonly error = signal('');

  /** Ciclo de vida: se ejecuta al crear la página; dispara la carga inicial. */
  ngOnInit(): void {
    this.compartidoService.listarRecibidos().subscribe({
      // Éxito: guarda la lista y apaga el spinner.
      next: (lista) => {
        this.compartidos.set(lista);
        this.cargando.set(false);
      },
      // Fallo (401/403/500...): apaga el spinner y muestra el mensaje traducido del ProblemDetail.
      error: (e: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(e));
      }
    });
  }
}
