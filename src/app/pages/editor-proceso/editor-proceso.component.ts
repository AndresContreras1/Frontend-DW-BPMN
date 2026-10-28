import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ActividadFormComponent } from '../../components/actividad-form/actividad-form.component';
import { DiagramaComponent } from '../../components/diagrama/diagrama.component';
import { EliminarElementoComponent } from '../../components/eliminar-elemento/eliminar-elemento.component';
import { EstadoProcesoComponent } from '../../components/estado-proceso/estado-proceso.component';
import { GatewayFormComponent } from '../../components/gateway-form/gateway-form.component';
import { LaneFormComponent } from '../../components/lane-form/lane-form.component';
import { LeyendaDiagramaComponent } from '../../components/leyenda-diagrama/leyenda-diagrama.component';
import { PanelElementoComponent, ReordenLanes } from '../../components/panel-elemento/panel-elemento.component';
import { PoolFormComponent } from '../../components/pool-form/pool-form.component';
import { SpinnerCargaComponent } from '../../components/spinner-carga/spinner-carga.component';
import { FormularioEditor } from '../../models/formulario-editor.model';
import { ProcesoDiagramaResponse, ProcesoResponse } from '../../models/proceso.model';
import { RolProcesoVistaResponse } from '../../models/rol-proceso.model';
import { SeleccionDiagrama } from '../../models/seleccion-diagrama.model';
import { AuthService } from '../../service/auth.service';
import { LaneService } from '../../service/lane.service';
import { NotificacionService } from '../../service/notificacion.service';
import { ProcesoService } from '../../service/proceso.service';
import { RolProcesoService } from '../../service/rol-proceso.service';
import { mensajeDeError } from '../../utils/problema';

type TipoNodoNuevo = 'actividad' | 'gateway' | 'evento';

/**
 * Editor del diagrama (HU-08 a HU-28). La página coordina: el diagrama muestra el modelo,
 * el panel de la derecha muestra el detalle o el formulario abierto, y tras cada cambio
 * confirmado por el backend se vuelve a pedir el diagrama.
 */
@Component({
  selector: 'app-editor-proceso',
  imports: [
    RouterLink,
    ActividadFormComponent,
    DiagramaComponent,
    EliminarElementoComponent,
    EstadoProcesoComponent,
    GatewayFormComponent,
    LaneFormComponent,
    LeyendaDiagramaComponent,
    PanelElementoComponent,
    PoolFormComponent,
    SpinnerCargaComponent
  ],
  templateUrl: './editor-proceso.component.html'
})
export class EditorProcesoComponent implements OnInit {
  private readonly procesoService = inject(ProcesoService);
  private readonly rolService = inject(RolProcesoService);
  private readonly laneService = inject(LaneService);
  private readonly notificaciones = inject(NotificacionService);
  readonly auth = inject(AuthService);
  readonly id = Number(inject(ActivatedRoute).snapshot.params['id']);

  readonly datos = signal<ProcesoDiagramaResponse | null>(null);
  readonly roles = signal<RolProcesoVistaResponse[]>([]);
  readonly seleccion = signal<SeleccionDiagrama | null>(null);
  readonly formulario = signal<FormularioEditor | null>(null);
  readonly aEliminar = signal<SeleccionDiagrama | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.rolService.listar().subscribe({
      next: (lista) => this.roles.set(lista),
      error: (e: unknown) => this.notificaciones.error(mensajeDeError(e))
    });
    this.recargar();
  }

  recargar(): void {
    this.procesoService.diagrama(this.id).subscribe({
      next: (diagrama) => {
        this.datos.set(diagrama);
        this.cargando.set(false);
        this.limpiarSeleccionHuerfana(diagrama);
      },
      error: (e: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(e));
      }
    });
  }

  como<T extends FormularioEditor['tipo']>(tipo: T): Extract<FormularioEditor, { tipo: T }> | null {
    const f = this.formulario();
    return f !== null && f.tipo === tipo ? (f as Extract<FormularioEditor, { tipo: T }>) : null;
  }

  alCambiarEstado(proceso: ProcesoResponse): void {
    const actual = this.datos();
    if (actual) {
      this.datos.set({ ...actual, proceso });
    }
  }

  // ---- Abrir formularios ----

  nuevoPool(): void {
    this.formulario.set({ tipo: 'pool', pool: null });
  }

  nuevaLane(poolId?: number): void {
    const destino = poolId ?? this.poolSeleccionado() ?? this.datos()?.pools.find((p) => !p.cajaNegra)?.id;
    if (destino === undefined) {
      this.notificaciones.advertencia('Primero crea un pool de la empresa (no de caja negra) para agregarle lanes.');
      return;
    }
    this.formulario.set({ tipo: 'lane', poolId: destino, lane: null });
  }

  nuevoNodo(tipo: TipoNodoNuevo, laneId?: number): void {
    const destino = laneId ?? this.laneSeleccionada();
    if (tipo === 'actividad') {
      this.formulario.set({ tipo, actividad: null, laneId: destino });
    } else if (tipo === 'gateway') {
      this.formulario.set({ tipo, gateway: null, laneId: destino });
    } else {
      this.formulario.set({ tipo, evento: null, laneId: destino });
    }
  }

  editar(sel: SeleccionDiagrama): void {
    const d = this.datos();
    if (!d) {
      return;
    }
    switch (sel.tipo) {
      case 'pool':
        this.formulario.set({ tipo: 'pool', pool: d.pools.find((p) => p.id === sel.id) ?? null });
        break;
      case 'lane': {
        const lane = d.lanes.find((l) => l.id === sel.id) ?? null;
        this.formulario.set({ tipo: 'lane', poolId: lane?.poolId ?? 0, lane });
        break;
      }
      case 'actividad':
        this.formulario.set({ tipo: 'actividad', actividad: d.actividades.find((a) => a.id === sel.id) ?? null });
        break;
      case 'gateway':
        this.formulario.set({ tipo: 'gateway', gateway: d.gateways.find((g) => g.id === sel.id) ?? null });
        break;
      case 'evento':
        this.formulario.set({ tipo: 'evento', evento: d.eventos.find((e) => e.id === sel.id) ?? null });
        break;
      case 'arco':
        this.formulario.set({ tipo: 'arco', arco: d.arcos.find((a) => a.id === sel.id) ?? null });
        break;
      case 'mensaje':
        this.formulario.set({ tipo: 'mensaje', mensaje: d.mensajes.find((m) => m.id === sel.id) ?? null });
        break;
    }
  }

  // ---- Resultados ----

  cerrarFormulario(): void {
    this.formulario.set(null);
  }

  alGuardar(mensaje: string): void {
    this.formulario.set(null);
    this.notificaciones.exito(mensaje);
    this.recargar();
  }

  pedirEliminar(sel: SeleccionDiagrama): void {
    this.aEliminar.set(sel);
  }

  cancelarEliminar(): void {
    this.aEliminar.set(null);
  }

  alEliminar(): void {
    this.aEliminar.set(null);
    this.seleccion.set(null);
    this.notificaciones.exito('Elemento eliminado.');
    this.recargar();
  }

  reordenar(orden: ReordenLanes): void {
    this.laneService.reordenar(orden.poolId, { laneIds: orden.laneIds }).subscribe({
      next: () => {
        this.notificaciones.exito('Orden de las lanes actualizado.');
        this.recargar();
      },
      error: (e: unknown) => this.notificaciones.error(mensajeDeError(e))
    });
  }

  private poolSeleccionado(): number | undefined {
    const sel = this.seleccion();
    const d = this.datos();
    if (sel?.tipo === 'pool') {
      return sel.id;
    }
    return sel?.tipo === 'lane' ? d?.lanes.find((l) => l.id === sel.id)?.poolId : undefined;
  }

  private laneSeleccionada(): number | undefined {
    const sel = this.seleccion();
    return sel?.tipo === 'lane' ? sel.id : undefined;
  }

  /** Si el elemento elegido ya no existe (se eliminó), se quita la selección. */
  private limpiarSeleccionHuerfana(d: ProcesoDiagramaResponse): void {
    const sel = this.seleccion();
    if (!sel) {
      return;
    }
    const listas: Record<SeleccionDiagrama['tipo'], { id: number }[]> = {
      pool: d.pools, lane: d.lanes, actividad: d.actividades, gateway: d.gateways,
      evento: d.eventos, arco: d.arcos, mensaje: d.mensajes
    };
    if (!listas[sel.tipo].some((x) => x.id === sel.id)) {
      this.seleccion.set(null);
    }
  }
}
