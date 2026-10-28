import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { SeleccionDiagrama } from '../../models/seleccion-diagrama.model';
import { ActividadService } from '../../service/actividad.service';
import { ArcoService } from '../../service/arco.service';
import { EventoMensajeService } from '../../service/evento-mensaje.service';
import { GatewayService } from '../../service/gateway.service';
import { LaneService } from '../../service/lane.service';
import { MensajeService } from '../../service/mensaje.service';
import { PoolService } from '../../service/pool.service';
import { DatosDiagrama } from '../../utils/diagrama-layout';
import { describirElemento } from '../../utils/descripcion-elemento';
import { mensajeDeError } from '../../utils/problema';
import { ImpactoEliminacionResponse } from '../../models/impacto-eliminacion.model';
import { ModalConfirmacionComponent } from '../modal-confirmacion/modal-confirmacion.component';

/**
 * Confirmación previa a eliminar un elemento del diagrama. Para actividades, gateways y arcos
 * consulta primero el impacto (nodos que quedarían sin entrada o salida) y lo muestra como advertencia.
 */
@Component({
  selector: 'app-eliminar-elemento',
  imports: [ModalConfirmacionComponent],
  templateUrl: './eliminar-elemento.component.html'
})
export class EliminarElementoComponent implements OnInit {
  private readonly pools = inject(PoolService);
  private readonly lanes = inject(LaneService);
  private readonly actividades = inject(ActividadService);
  private readonly gateways = inject(GatewayService);
  private readonly eventos = inject(EventoMensajeService);
  private readonly arcos = inject(ArcoService);
  private readonly mensajes = inject(MensajeService);

  readonly datos = input.required<DatosDiagrama>();
  readonly elemento = input.required<SeleccionDiagrama>();
  readonly eliminado = output<void>();
  readonly cancelar = output<void>();

  readonly impacto = signal<ImpactoEliminacionResponse | null>(null);
  readonly error = signal('');
  readonly procesando = signal(false);

  nombre(): string {
    return describirElemento(this.datos(), this.elemento())?.titulo ?? '';
  }

  mensaje(): string {
    const base = '¿Eliminar ' + this.nombre() + '? Esta acción no se puede deshacer.';
    return this.error() ? base + ' ' + this.error() : base;
  }

  advertencias(): string[] {
    return this.impacto()?.advertencias ?? [];
  }

  ngOnInit(): void {
    const { tipo, id } = this.elemento();
    const consulta = this.consultarImpacto(tipo, id);
    if (consulta) {
      consulta.subscribe({
        next: (impacto) => this.impacto.set(impacto),
        error: (e: unknown) => this.error.set(mensajeDeError(e))
      });
    }
  }

  confirmar(): void {
    this.procesando.set(true);
    this.error.set('');
    this.eliminar(this.elemento()).subscribe({
      next: () => {
        this.procesando.set(false);
        this.eliminado.emit();
      },
      error: (e: unknown) => {
        this.procesando.set(false);
        this.error.set(mensajeDeError(e));
      }
    });
  }

  private consultarImpacto(tipo: SeleccionDiagrama['tipo'], id: number): Observable<ImpactoEliminacionResponse> | null {
    switch (tipo) {
      case 'actividad':
        return this.actividades.impactoEliminacion(id);
      case 'gateway':
        return this.gateways.impactoEliminacion(id);
      case 'arco':
        return this.arcos.impactoEliminacion(id);
      default:
        return null;
    }
  }

  private eliminar(sel: SeleccionDiagrama): Observable<void> {
    switch (sel.tipo) {
      case 'pool':
        return this.pools.eliminar(sel.id);
      case 'lane':
        return this.lanes.eliminar(sel.id);
      case 'actividad':
        return this.actividades.eliminar(sel.id);
      case 'gateway':
        return this.gateways.eliminar(sel.id);
      case 'evento':
        return this.eventos.eliminar(sel.id);
      case 'arco':
        return this.arcos.eliminar(sel.id);
      case 'mensaje':
        return this.mensajes.eliminar(sel.id);
    }
  }
}
