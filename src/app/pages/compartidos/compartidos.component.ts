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
  private readonly compartidoService = inject(ProcesoCompartidoService);

  readonly compartidos = signal<ProcesoCompartidoResponse[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.compartidoService.listarRecibidos().subscribe({
      next: (lista) => {
        this.compartidos.set(lista);
        this.cargando.set(false);
      },
      error: (e: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(e));
      }
    });
  }
}
