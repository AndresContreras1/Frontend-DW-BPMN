// Página /procesos/:id/editor (HU-08 a HU-28): editor del diagrama BPMN de un proceso. Protegida con rolGuard (acceso ADMINISTRADOR o EDITOR).
// Es la página "orquestadora": no dibuja ni valida por sí misma, delega en componentes hijos:
// - app-diagrama muestra el modelo y emite qué elemento se seleccionó.
// - app-panel-elemento muestra el detalle del elemento elegido y los botones de acción.
// - los app-*-form (pool, lane, actividad, gateway, evento, arco, mensaje) son los formularios de alta/edición; cada uno habla con su servicio.
// Conceptos:
// - Estrategia PESIMISTA: el diagrama NO se modifica en la pantalla; tras cada cambio confirmado por el backend se vuelve a pedir el diagrama completo (recargar()).
// - switchMap: el diagrama y la validación del modelo son peticiones dependientes encadenadas.
// - Roles de ACCESO (puedeEditar/esAdministrador) + permisos de estructura propios por rol (crearPool, crearLane...) deciden qué botones se habilitan.
//   Los roles de PROCESO (catálogo) solo sirven para nombrar la responsabilidad de cada lane.
// - Un signal "formulario" con unión discriminada (campo tipo) decide cuál formulario se muestra en el panel derecho.
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ActividadFormComponent } from '../../components/actividad-form/actividad-form.component';
import { ArcoFormComponent } from '../../components/arco-form/arco-form.component';
import { DiagramaComponent } from '../../components/diagrama/diagrama.component';
import { EliminarElementoComponent } from '../../components/eliminar-elemento/eliminar-elemento.component';
import { EstadoProcesoComponent } from '../../components/estado-proceso/estado-proceso.component';
import { EventoFormComponent } from '../../components/evento-form/evento-form.component';
import { GatewayFormComponent } from '../../components/gateway-form/gateway-form.component';
import { LaneFormComponent } from '../../components/lane-form/lane-form.component';
import { LeyendaDiagramaComponent } from '../../components/leyenda-diagrama/leyenda-diagrama.component';
import { MensajeFormComponent } from '../../components/mensaje-form/mensaje-form.component';
import { PanelAdvertenciasComponent } from '../../components/panel-advertencias/panel-advertencias.component';
import { PanelElementoComponent, ReordenLanes } from '../../components/panel-elemento/panel-elemento.component';
import { PoolFormComponent } from '../../components/pool-form/pool-form.component';
import { SpinnerCargaComponent } from '../../components/spinner-carga/spinner-carga.component';
import { PermisoEstructuraResponse } from '../../models/permiso-estructura.model';
import { ValidacionModeloResponse } from '../../models/validacion-modelo.model';
import { FormularioEditor } from '../../models/formulario-editor.model';
import { ProcesoDiagramaResponse, ProcesoResponse } from '../../models/proceso.model';
import { RolProcesoVistaResponse } from '../../models/rol-proceso.model';
import { SeleccionDiagrama } from '../../models/seleccion-diagrama.model';
import { AuthService } from '../../service/auth.service';
import { LaneService } from '../../service/lane.service';
import { PermisoEstructuraService } from '../../service/permiso-estructura.service';
import { NotificacionService } from '../../service/notificacion.service';
import { ProcesoService } from '../../service/proceso.service';
import { RolProcesoService } from '../../service/rol-proceso.service';
import { mensajeDeError } from '../../utils/problema';

/** Tipos de nodo que se pueden crear desde la barra de herramientas o desde una lane (los demás elementos tienen botón propio). */
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
    ArcoFormComponent,
    DiagramaComponent,
    EliminarElementoComponent,
    EstadoProcesoComponent,
    EventoFormComponent,
    GatewayFormComponent,
    LaneFormComponent,
    LeyendaDiagramaComponent,
    MensajeFormComponent,
    PanelAdvertenciasComponent,
    PanelElementoComponent,
    PoolFormComponent,
    SpinnerCargaComponent
  ],
  templateUrl: './editor-proceso.component.html'
})
/** Estado de la página en signals. La fuente de verdad del modelo es siempre lo que devuelve el backend. */
export class EditorProcesoComponent implements OnInit {
  /** Servicio de procesos: diagrama(id) y validacion(id). */
  private readonly procesoService = inject(ProcesoService);
  /** Servicio del catálogo de roles de proceso (para elegir el responsable de una lane). */
  private readonly rolService = inject(RolProcesoService);
  /** Servicio de lanes: aquí solo se usa reordenar(). */
  private readonly laneService = inject(LaneService);
  /** Servicio de permisos de estructura: mio() trae los permisos del rol de acceso del usuario actual. */
  private readonly permisoService = inject(PermisoEstructuraService);
  /** Toasts de éxito, error y advertencia. */
  private readonly notificaciones = inject(NotificacionService);
  /** Sesión: roles de acceso del usuario (puedeEditar, esAdministrador). */
  readonly auth = inject(AuthService);
  /** Id del proceso leído de la URL con ActivatedRoute.snapshot.params; llega como texto, por eso Number(...). */
  readonly id = Number(inject(ActivatedRoute).snapshot.params['id']);

  /** Diagrama completo del proceso (pools, lanes, actividades, gateways, eventos, arcos, mensajes) tal como lo devuelve el backend. */
  readonly datos = signal<ProcesoDiagramaResponse | null>(null);
  /** Catálogo de roles de proceso disponibles para asignar a las lanes. */
  readonly roles = signal<RolProcesoVistaResponse[]>([]);
  /** Permisos de estructura (pools/lanes) del rol de acceso del usuario actual; null mientras cargan. */
  readonly permisos = signal<PermisoEstructuraResponse | null>(null);
  /** Resultado de la validación del modelo calculada por el backend (advertencias que se muestran en el panel). */
  readonly validacion = signal<ValidacionModeloResponse | null>(null);
  /** Elemento actualmente elegido en el diagrama (tipo + id) o null. */
  readonly seleccion = signal<SeleccionDiagrama | null>(null);
  /** Formulario abierto en el panel derecho (unión discriminada por "tipo") o null si se muestra el detalle del elemento. */
  readonly formulario = signal<FormularioEditor | null>(null);
  /** Elemento pendiente de eliminar; mientras no sea null se muestra el componente de confirmación. */
  readonly aEliminar = signal<SeleccionDiagrama | null>(null);
  /** Signal: true hasta que llega el diagrama y su validación la primera vez. */
  readonly cargando = signal(true);
  /** Mensaje si falla la carga del diagrama (404 no existe, 403 sin acceso...). */
  readonly error = signal('');

  /**
   * Carga tres cosas independientes: roles de proceso, permisos de estructura del usuario y el diagrama.
   * Si fallan los roles o los permisos solo se avisa con un toast (el editor sigue); si falla el diagrama se muestra error de página.
   */
  ngOnInit(): void {
    this.rolService.listar().subscribe({
      next: (lista) => this.roles.set(lista),
      error: (e: unknown) => this.notificaciones.error(mensajeDeError(e))
    });
    // Permisos propios: determinan si se habilitan los botones + Pool y + Lane.
    this.permisoService.mio().subscribe({
      next: (p) => this.permisos.set(p),
      error: (e: unknown) => this.notificaciones.error(mensajeDeError(e))
    });
    this.recargar();
  }

  /** Pide el diagrama y, encadenada con switchMap, la validación del modelo que calcula el backend. */
  recargar(): void {
    this.procesoService
      .diagrama(this.id)
      .pipe(
        switchMap((diagrama) => {
          this.datos.set(diagrama);
          this.limpiarSeleccionHuerfana(diagrama);
          return this.procesoService.validacion(this.id);
        })
      )
      .subscribe({
      next: (validacion) => {
        this.validacion.set(validacion);
        this.cargando.set(false);
      },
      error: (e: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(e));
      }
    });
  }

  /**
   * Estrecha el tipo de la unión: devuelve el formulario abierto solo si es del tipo pedido (si no, null).
   * La plantilla lo usa dentro de cada @case para obtener un objeto con el tipo correcto (f.pool, f.lane...) sin conversiones.
   */
  como<T extends FormularioEditor['tipo']>(tipo: T): Extract<FormularioEditor, { tipo: T }> | null {
    const f = this.formulario();
    return f !== null && f.tipo === tipo ? (f as Extract<FormularioEditor, { tipo: T }>) : null;
  }

  /** Handler de (cambiado) del selector de estado: el backend ya confirmó; se actualiza solo el proceso dentro de los datos sin recargar todo. */
  alCambiarEstado(proceso: ProcesoResponse): void {
    const actual = this.datos();
    if (actual) {
      this.datos.set({ ...actual, proceso });
    }
  }

  // ---- Abrir formularios ----

  /** Botón + Pool: requiere rol de acceso con edición Y el permiso de estructura crearPool (HU-24). Si los permisos no han llegado, se asume false. */
  puedeCrearPool(): boolean {
    return this.auth.puedeEditar() && (this.permisos()?.crearPool ?? false);
  }

  /** Botón + Lane: igual que el de pool, con el permiso crearLane. */
  puedeCrearLane(): boolean {
    return this.auth.puedeEditar() && (this.permisos()?.crearLane ?? false);
  }

  /** Abre el formulario de pool en modo creación (pool: null). */
  nuevoPool(): void {
    this.formulario.set({ tipo: 'pool', pool: null });
  }

  /**
   * Abre el formulario de lane. Destino del pool: el indicado, o el del elemento seleccionado, o el primer pool de la empresa.
   * Un pool de caja negra (externo) no tiene lanes, por eso se excluye; si no hay ninguno se advierte al usuario.
   */
  nuevaLane(poolId?: number): void {
    const destino = poolId ?? this.poolSeleccionado() ?? this.datos()?.pools.find((p) => !p.cajaNegra)?.id;
    if (destino === undefined) {
      this.notificaciones.advertencia('Primero crea un pool de la empresa (no de caja negra) para agregarle lanes.');
      return;
    }
    this.formulario.set({ tipo: 'lane', poolId: destino, lane: null });
  }

  /** Abre el formulario de arco (flujo de secuencia) en modo creación. */
  nuevoArco(): void {
    this.formulario.set({ tipo: 'arco', arco: null });
  }

  /** Abre el formulario de mensaje entre pools (HU-25 a HU-28) en modo creación. */
  nuevoMensaje(): void {
    this.formulario.set({ tipo: 'mensaje', mensaje: null });
  }

  /**
   * Abre el formulario de actividad, gateway o evento. laneId preselecciona la lane (la indicada o la que esté seleccionada).
   * Se ramifica por tipo porque cada formulario espera un campo distinto (actividad, gateway o evento).
   */
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

  /** Abre el formulario en modo edición: busca en los datos el elemento seleccionado según su tipo y lo pasa al formulario correspondiente. */
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

  /** Cierra el formulario y vuelve al panel de detalle (sin guardar). */
  cerrarFormulario(): void {
    this.formulario.set(null);
  }

  /**
   * Handler común de (guardado) de TODOS los formularios: el hijo ya recibió la confirmación del backend (pesimista).
   * Aquí se cierra el formulario, se avisa y se recarga el diagrama para ver el resultado real.
   */
  alGuardar(mensaje: string): void {
    this.formulario.set(null);
    this.notificaciones.exito(mensaje);
    this.recargar();
  }

  /** Abre la confirmación de eliminación para el elemento elegido. */
  pedirEliminar(sel: SeleccionDiagrama): void {
    this.aEliminar.set(sel);
  }

  /** Cierra la confirmación sin eliminar. */
  cancelarEliminar(): void {
    this.aEliminar.set(null);
  }

  /** Handler de (eliminado): el componente de eliminación ya recibió el OK del backend; se limpia la selección, se avisa y se recarga el diagrama. */
  alEliminar(): void {
    this.aEliminar.set(null);
    this.seleccion.set(null);
    this.notificaciones.exito('Elemento eliminado.');
    this.recargar();
  }

  /**
   * Reordena las lanes de un pool (drag/botones del panel). Envía al backend la lista de ids en el nuevo orden.
   * Pesimista: el orden en pantalla cambia solo cuando, tras el OK, se recarga el diagrama.
   */
  reordenar(orden: ReordenLanes): void {
    this.laneService.reordenar(orden.poolId, { laneIds: orden.laneIds }).subscribe({
      next: () => {
        this.notificaciones.exito('Orden de las lanes actualizado.');
        this.recargar();
      },
      error: (e: unknown) => this.notificaciones.error(mensajeDeError(e))
    });
  }

  /** Pool "actual": el seleccionado, o el pool de la lane seleccionada; undefined si nada aplica. */
  private poolSeleccionado(): number | undefined {
    const sel = this.seleccion();
    const d = this.datos();
    if (sel?.tipo === 'pool') {
      return sel.id;
    }
    return sel?.tipo === 'lane' ? d?.lanes.find((l) => l.id === sel.id)?.poolId : undefined;
  }

  /** Lane seleccionada, si lo seleccionado es una lane. */
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
    // Mapa de tipo de elemento -> su lista en los datos; permite comprobar con una sola búsqueda si el elemento seleccionado sigue existiendo.
    const listas: Record<SeleccionDiagrama['tipo'], { id: number }[]> = {
      pool: d.pools, lane: d.lanes, actividad: d.actividades, gateway: d.gateways,
      evento: d.eventos, arco: d.arcos, mensaje: d.mensajes
    };
    if (!listas[sel.tipo].some((x) => x.id === sel.id)) {
      this.seleccion.set(null);
    }
  }
}
