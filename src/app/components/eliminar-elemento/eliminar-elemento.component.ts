// =====================================================================================
// eliminar-elemento.component.ts
// Cuadro de confirmación previo a ELIMINAR cualquier elemento del diagrama (pool, lane, actividad, gateway, evento,
// arco o mensaje). Antes de borrar, para actividades, gateways y arcos consulta al backend el "impacto": qué nodos
// quedarían sin entrada o sin salida (el modelo BPMN quedaría incoherente) y lo muestra como advertencia.
// Reutiliza el modal genérico (ModalConfirmacionComponent); aquí solo está la lógica de qué servicio llamar.
// =====================================================================================
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
  /** Un servicio por tipo de elemento; cada uno sabe borrar (y, algunos, consultar el impacto) en su endpoint. */
  private readonly pools = inject(PoolService);
  private readonly lanes = inject(LaneService);
  private readonly actividades = inject(ActividadService);
  private readonly gateways = inject(GatewayService);
  private readonly eventos = inject(EventoMensajeService);
  private readonly arcos = inject(ArcoService);
  private readonly mensajes = inject(MensajeService);

  /** Modelo del diagrama (para obtener el nombre del elemento a mostrar). */
  readonly datos = input.required<DatosDiagrama>();
  /** Elemento a eliminar (tipo + id). */
  readonly elemento = input.required<SeleccionDiagrama>();
  /** Output: se eliminó con éxito (el padre cierra el modal y recarga). */
  readonly eliminado = output<void>();
  /** Output: el usuario canceló. */
  readonly cancelar = output<void>();

  /** Impacto devuelto por el backend (advertencias); null mientras carga o si el tipo no tiene consulta de impacto. */
  readonly impacto = signal<ImpactoEliminacionResponse | null>(null);
  /** Error de la consulta o de la eliminación, que se anexa al mensaje del modal. */
  readonly error = signal('');
  /** True mientras se ejecuta el borrado (deshabilita el botón de confirmar). */
  readonly procesando = signal(false);

  /** Título legible del elemento (nombre) a partir de la descripción; '' si ya no existe. */
  nombre(): string {
    return describirElemento(this.datos(), this.elemento())?.titulo ?? '';
  }

  /** Texto del modal: la pregunta de confirmación y, si hubo error, el error a continuación. */
  mensaje(): string {
    const base = '¿Eliminar ' + this.nombre() + '? Esta acción no se puede deshacer.';
    return this.error() ? base + ' ' + this.error() : base;
  }

  /** Advertencias de impacto para el modal (lista vacía si no hay). */
  advertencias(): string[] {
    return this.impacto()?.advertencias ?? [];
  }

  /** Al abrirse, consulta el impacto (solo actividad, gateway y arco); si falla, muestra el error. */
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

  /** El usuario confirma: ejecuta la eliminación; si sale bien emite `eliminado`, si falla muestra el error del backend. */
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

  /** Elige la consulta de impacto según el tipo; pools, lanes, eventos y mensajes no la tienen (devuelve null). */
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

  /** Despacha la eliminación al servicio correcto según el tipo (el switch cubre todos los tipos de SeleccionDiagrama). */
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
