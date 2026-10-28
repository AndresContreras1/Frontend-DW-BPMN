// Pruebas unitarias del editor de procesos (HU-08 a HU-28). Se simulan los servicios (espías) con of(...) para éxito y throwError(...) para fallos,
// se fija el rol de acceso guardando una sesión falsa en TokenService, y se reemplaza ActivatedRoute para simular la URL /procesos/7/editor.
// Ideas validadas: carga encadenada diagrama -> validación (switchMap), permisos de estructura por rol, apertura del formulario correcto por tipo,
// estrategia pesimista (se recarga el diagrama tras confirmar el backend) y selección huérfana.
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProcesoDiagramaResponse } from '../../models/proceso.model';
import { LaneService } from '../../service/lane.service';
import { NotificacionService } from '../../service/notificacion.service';
import { PermisoEstructuraService } from '../../service/permiso-estructura.service';
import { ProcesoService } from '../../service/proceso.service';
import { RolProcesoService } from '../../service/rol-proceso.service';
import { TokenService } from '../../service/token.service';
import { diagramaEjemplo, procesoBase } from '../../testing/datos';
import { EditorProcesoComponent } from './editor-proceso.component';

// Permisos de estructura del ADMINISTRADOR: todo permitido.
const permisosAdmin = { rolAcceso: 'ADMINISTRADOR' as const, crearPool: true, editarPool: true, eliminarPool: true, crearLane: true, editarLane: true, eliminarLane: true };
// Permisos del EDITOR: no puede crear pools ni eliminar; sí crear y editar lanes (así se prueban botones deshabilitados).
const permisosEditor = { rolAcceso: 'EDITOR' as const, crearPool: false, editarPool: true, eliminarPool: false, crearLane: true, editarLane: true, eliminarLane: false };

// Agrupa las pruebas de la página del editor.
describe('EditorProcesoComponent', () => {
  let permisosSvc: jasmine.SpyObj<PermisoEstructuraService>;
  let procesos: jasmine.SpyObj<ProcesoService>;
  let roles: jasmine.SpyObj<RolProcesoService>;
  let lanes: jasmine.SpyObj<LaneService>;

  // Ayudante: guarda sesión con el rol pedido, crea espías de los 4 servicios, fija id=7 en la ruta, crea el componente y ejecuta la primera detección (ngOnInit).
  function crear(rol: 'ADMINISTRADOR' | 'EDITOR' = 'ADMINISTRADOR', diagrama: ProcesoDiagramaResponse = diagramaEjemplo) {
    localStorage.clear();
    new TokenService().guardarSesion('t', { id: 1, nombre: 'U', email: 'u@d.com', rolAcceso: rol, activo: true });
    procesos = jasmine.createSpyObj<ProcesoService>('ProcesoService', ['diagrama', 'cambiarEstado', 'validacion']);
    procesos.diagrama.and.returnValue(of(diagrama));
    procesos.validacion.and.returnValue(of({ valido: false, advertencias: ['El gateway "Aprobada" debe tener al menos dos salidas.'] }));
    permisosSvc = jasmine.createSpyObj<PermisoEstructuraService>('PermisoEstructuraService', ['mio']);
    permisosSvc.mio.and.returnValue(of(rol === 'ADMINISTRADOR' ? permisosAdmin : permisosEditor));
    roles = jasmine.createSpyObj<RolProcesoService>('RolProcesoService', ['listar']);
    roles.listar.and.returnValue(of([{ id: 1, nombre: 'Empleado', procesosQueLoUsan: 1, enUso: true }]));
    lanes = jasmine.createSpyObj<LaneService>('LaneService', ['reordenar']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProcesoService, useValue: procesos },
        { provide: PermisoEstructuraService, useValue: permisosSvc },
        { provide: RolProcesoService, useValue: roles },
        { provide: LaneService, useValue: lanes },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: '7' } } } }
      ]
    });
    const fixture = TestBed.createComponent(EditorProcesoComponent);
    fixture.detectChanges();
    return fixture;
  }

  // Valida que al abrir se piden los permisos propios y la validación del modelo (encadenada tras el diagrama) y que las advertencias del backend se pintan.
  it('inicio_cargaPermisosYValidacionDelBackend', () => {
    const fixture = crear();
    expect(permisosSvc.mio).toHaveBeenCalled();
    expect(procesos.validacion).toHaveBeenCalledWith(7);
    expect(fixture.componentInstance.validacion()?.valido).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).querySelector('#listaAdvertenciasModelo')?.textContent).toContain('al menos dos salidas');
  });

  // Valida roles de acceso + permisos de estructura: el EDITOR sin permiso crearPool ve + Pool deshabilitado, pero + Lane habilitado.
  it('editorSinPermisoParaCrearPool_tieneElBotonDeshabilitado', () => {
    const fixture = crear('EDITOR');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector<HTMLButtonElement>('#btnNuevoPool')?.disabled).toBeTrue();
    expect(el.querySelector<HTMLButtonElement>('#btnNuevaLane')?.disabled).toBeFalse();
  });

  // Valida la carga inicial: se pide el diagrama del proceso 7, se pinta el título y el SVG, y se cargan los roles de proceso del catálogo.
  it('inicio_cargaDiagramaYRoles', () => {
    const fixture = crear();
    const el: HTMLElement = fixture.nativeElement;
    expect(procesos.diagrama).toHaveBeenCalledWith(7);
    expect(el.querySelector('#tituloEditor')?.textContent).toContain('Vacaciones');
    expect(el.querySelector('#svgDiagrama')).not.toBeNull();
    expect(fixture.componentInstance.roles().length).toBe(1);
  });

  // Valida el manejo de errores: aunque fallen permisos (500) y roles (403), el 404 del diagrama deja en error() el detalle del ProblemDetail.
  it('inicio_error404_muestraElMensaje', () => {
    localStorage.clear();
    procesos = jasmine.createSpyObj<ProcesoService>('ProcesoService', ['diagrama']);
    permisosSvc = jasmine.createSpyObj<PermisoEstructuraService>('PermisoEstructuraService', ['mio']);
    permisosSvc.mio.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    procesos.diagrama.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'Proceso no encontrado.' } })));
    roles = jasmine.createSpyObj<RolProcesoService>('RolProcesoService', ['listar']);
    roles.listar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403, error: { detail: 'Sin permisos' } })));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProcesoService, useValue: procesos },
        { provide: PermisoEstructuraService, useValue: permisosSvc },
        { provide: RolProcesoService, useValue: roles },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: '7' } } } }
      ]
    });
    const fixture = TestBed.createComponent(EditorProcesoComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBe('Proceso no encontrado.');
  });

  // Valida, para cada tipo de elemento (pool, lane, actividad, gateway, evento, arco, mensaje), que editar() abre el formulario de ese tipo; y que cerrar lo deja en null.
  it('elegirUnElemento_yEditar_abreElFormularioCorrespondiente', () => {
    const fixture = crear();
    const c = fixture.componentInstance;
    const casos: [Parameters<typeof c.editar>[0], Parameters<typeof c.como>[0]][] = [
      [{ tipo: 'pool', id: 1 }, 'pool'],
      [{ tipo: 'lane', id: 10 }, 'lane'],
      [{ tipo: 'actividad', id: 100 }, 'actividad'],
      [{ tipo: 'gateway', id: 102 }, 'gateway'],
      [{ tipo: 'evento', id: 103 }, 'evento'],
      [{ tipo: 'arco', id: 200 }, 'arco'],
      [{ tipo: 'mensaje', id: 300 }, 'mensaje']
    ];
    for (const [sel, tipo] of casos) {
      c.editar(sel);
      expect(c.formulario()?.tipo).toBe(tipo);
    }
    c.cerrarFormulario();
    expect(c.formulario()).toBeNull();
  });

  // Valida que los botones de la barra de herramientas abren sus formularios (se detecta el botón Guardar de cada uno): pool, lane, actividad y gateway.
  it('botonesDeLaBarra_abrenLosFormularios', () => {
    const fixture = crear();
    const el: HTMLElement = fixture.nativeElement;
    el.querySelector<HTMLButtonElement>('#btnNuevoPool')?.click();
    fixture.detectChanges();
    expect(el.querySelector('#btnGuardarPool')).not.toBeNull();
    el.querySelector<HTMLButtonElement>('#btnCancelarPool')?.click();
    el.querySelector<HTMLButtonElement>('#btnNuevaLane')?.click();
    fixture.detectChanges();
    expect(el.querySelector('#btnGuardarLane')).not.toBeNull();
    fixture.componentInstance.cerrarFormulario();
    el.querySelector<HTMLButtonElement>('#btnNuevaActividad')?.click();
    fixture.detectChanges();
    expect(el.querySelector('#btnGuardarActividad')).not.toBeNull();
    fixture.componentInstance.cerrarFormulario();
    el.querySelector<HTMLButtonElement>('#btnNuevoGateway')?.click();
    fixture.detectChanges();
    expect(el.querySelector('#btnGuardarGateway')).not.toBeNull();
  });

  // Valida los botones de evento, arco y mensaje, y que el panel de advertencias del modelo está presente.
  it('barraDeFlujo_abreEventoArcoYMensajeYMuestraLasAdvertencias', () => {
    const fixture = crear();
    const el: HTMLElement = fixture.nativeElement;
    el.querySelector<HTMLButtonElement>('#btnNuevoEvento')?.click();
    fixture.detectChanges();
    expect(el.querySelector('#btnGuardarEvento')).not.toBeNull();
    fixture.componentInstance.cerrarFormulario();
    el.querySelector<HTMLButtonElement>('#btnNuevoArco')?.click();
    fixture.detectChanges();
    expect(el.querySelector('#btnGuardarArco')).not.toBeNull();
    fixture.componentInstance.cerrarFormulario();
    el.querySelector<HTMLButtonElement>('#btnNuevoMensaje')?.click();
    fixture.detectChanges();
    expect(el.querySelector('#btnGuardarMensaje')).not.toBeNull();
    expect(el.querySelector('#panelAdvertencias')).not.toBeNull();
  });

  // Valida que editar un mensaje precarga su nombre y que editar un arco muestra el formulario con sus selectores de origen.
  it('editarMensajeYArco_abreSusFormulariosPrecargados', () => {
    const fixture = crear();
    fixture.componentInstance.editar({ tipo: 'mensaje', id: 300 });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector<HTMLInputElement>('#txtNombreMensaje')?.value).toBe('Orden de pago');
    fixture.componentInstance.editar({ tipo: 'arco', id: 202 });
    fixture.detectChanges();
    expect(el.querySelector('#selOrigenArco')).not.toBeNull();
  });

  // Valida la regla de negocio: sin pool de la empresa (solo caja negra) no se abre el formulario de lane y se advierte al usuario.
  it('nuevaLane_sinPoolDeEmpresa_avisa', () => {
    const fixture = crear('ADMINISTRADOR', { ...diagramaEjemplo, pools: [diagramaEjemplo.pools[1]], lanes: [] });
    spyOn(TestBed.inject(NotificacionService), 'advertencia');
    fixture.componentInstance.nuevaLane();
    expect(fixture.componentInstance.formulario()).toBeNull();
    expect(TestBed.inject(NotificacionService).advertencia).toHaveBeenCalled();
  });

  // Valida el pool destino de la nueva lane: el de la lane seleccionada o el pool seleccionado directamente.
  it('nuevaLane_conPoolSeleccionado_usaEsePool', () => {
    const fixture = crear();
    fixture.componentInstance.seleccion.set({ tipo: 'lane', id: 11 });
    fixture.componentInstance.nuevaLane();
    expect(fixture.componentInstance.como('lane')?.poolId).toBe(1);
    fixture.componentInstance.seleccion.set({ tipo: 'pool', id: 2 });
    fixture.componentInstance.nuevaLane();
    expect(fixture.componentInstance.como('lane')?.poolId).toBe(2);
  });

  // Valida que un nodo nuevo hereda la lane seleccionada, que un laneId explícito tiene prioridad y que solo existe el formulario del tipo abierto.
  it('nuevoNodo_enLaneSeleccionada_precargaLaLane', () => {
    const fixture = crear();
    fixture.componentInstance.seleccion.set({ tipo: 'lane', id: 11 });
    fixture.componentInstance.nuevoNodo('evento');
    expect(fixture.componentInstance.como('evento')?.laneId).toBe(11);
    fixture.componentInstance.nuevoNodo('gateway', 10);
    expect(fixture.componentInstance.como('gateway')?.laneId).toBe(10);
    expect(fixture.componentInstance.como('actividad')).toBeNull();
  });

  // Valida la estrategia pesimista: al guardar se cierra el formulario y se vuelve a pedir el diagrama (2 llamadas: inicial + recarga).
  it('alGuardar_cierraElFormularioYRecargaElDiagrama', () => {
    const fixture = crear();
    fixture.componentInstance.nuevoPool();
    fixture.componentInstance.alGuardar('Pool guardado.');
    expect(fixture.componentInstance.formulario()).toBeNull();
    expect(procesos.diagrama).toHaveBeenCalledTimes(2);
  });

  // Valida el flujo de eliminación: pedir, cancelar, y al confirmar se limpia la selección y se recarga un diagrama sin ese elemento.
  it('eliminar_flujoCompleto_limpiaLaSeleccionYRecarga', () => {
    const fixture = crear();
    fixture.componentInstance.seleccion.set({ tipo: 'actividad', id: 100 });
    fixture.componentInstance.pedirEliminar({ tipo: 'actividad', id: 100 });
    expect(fixture.componentInstance.aEliminar()).not.toBeNull();
    fixture.componentInstance.cancelarEliminar();
    expect(fixture.componentInstance.aEliminar()).toBeNull();
    procesos.diagrama.and.returnValue(of({ ...diagramaEjemplo, actividades: diagramaEjemplo.actividades.slice(1) }));
    fixture.componentInstance.alEliminar();
    expect(fixture.componentInstance.seleccion()).toBeNull();
    expect(fixture.componentInstance.datos()?.actividades.length).toBe(1);
  });

  // Valida la selección huérfana: si tras recargar el elemento elegido ya no existe, la selección se borra.
  it('recargar_conSeleccionQueYaNoExiste_laQuita', () => {
    const fixture = crear();
    fixture.componentInstance.seleccion.set({ tipo: 'gateway', id: 102 });
    procesos.diagrama.and.returnValue(of({ ...diagramaEjemplo, gateways: [] }));
    fixture.componentInstance.recargar();
    expect(fixture.componentInstance.seleccion()).toBeNull();
  });

  // Valida el caso contrario: si el elemento sigue existiendo, la selección se mantiene.
  it('recargar_conSeleccionVigente_laConserva', () => {
    const fixture = crear();
    fixture.componentInstance.seleccion.set({ tipo: 'pool', id: 1 });
    fixture.componentInstance.recargar();
    expect(fixture.componentInstance.seleccion()).toEqual({ tipo: 'pool', id: 1 });
  });

  // Valida el reordenamiento de lanes: éxito -> llama al servicio con los ids y recarga; error 403 -> toast con el detalle del backend.
  it('reordenar_exito_recargaYError_avisa', () => {
    const fixture = crear();
    lanes.reordenar.and.returnValue(of([]));
    fixture.componentInstance.reordenar({ poolId: 1, laneIds: [11, 10] });
    expect(lanes.reordenar).toHaveBeenCalledWith(1, { laneIds: [11, 10] });
    expect(procesos.diagrama).toHaveBeenCalledTimes(2);
    lanes.reordenar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403, error: { detail: 'Sin permiso para editar lanes.' } })));
    spyOn(TestBed.inject(NotificacionService), 'error');
    fixture.componentInstance.reordenar({ poolId: 1, laneIds: [10, 11] });
    expect(TestBed.inject(NotificacionService).error).toHaveBeenCalledWith('Sin permiso para editar lanes.');
  });

  // Valida que un cambio de estado confirmado actualiza el proceso dentro de los datos sin recargar.
  it('alCambiarEstado_actualizaElProcesoDelModelo', () => {
    const fixture = crear();
    fixture.componentInstance.alCambiarEstado({ ...procesoBase, estado: 'PUBLICADO' });
    expect(fixture.componentInstance.datos()?.proceso.estado).toBe('PUBLICADO');
  });

  // Valida permisos en el panel de detalle: el EDITOR puede editar un elemento pero no ve el botón Eliminar.
  it('editorSinPermisoDeEliminar_noVeElBotonEliminar', () => {
    const fixture = crear('EDITOR');
    fixture.componentInstance.seleccion.set({ tipo: 'actividad', id: 100 });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#btnEditarElemento')).not.toBeNull();
    expect(el.querySelector('#btnEliminarElemento')).toBeNull();
  });
});
