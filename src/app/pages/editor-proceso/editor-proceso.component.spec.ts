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

const permisosAdmin = { rolAcceso: 'ADMINISTRADOR' as const, crearPool: true, editarPool: true, eliminarPool: true, crearLane: true, editarLane: true, eliminarLane: true };
const permisosEditor = { rolAcceso: 'EDITOR' as const, crearPool: false, editarPool: true, eliminarPool: false, crearLane: true, editarLane: true, eliminarLane: false };

describe('EditorProcesoComponent', () => {
  let permisosSvc: jasmine.SpyObj<PermisoEstructuraService>;
  let procesos: jasmine.SpyObj<ProcesoService>;
  let roles: jasmine.SpyObj<RolProcesoService>;
  let lanes: jasmine.SpyObj<LaneService>;

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

  it('inicio_cargaPermisosYValidacionDelBackend', () => {
    const fixture = crear();
    expect(permisosSvc.mio).toHaveBeenCalled();
    expect(procesos.validacion).toHaveBeenCalledWith(7);
    expect(fixture.componentInstance.validacion()?.valido).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).querySelector('#listaAdvertenciasModelo')?.textContent).toContain('al menos dos salidas');
  });

  it('editorSinPermisoParaCrearPool_tieneElBotonDeshabilitado', () => {
    const fixture = crear('EDITOR');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector<HTMLButtonElement>('#btnNuevoPool')?.disabled).toBeTrue();
    expect(el.querySelector<HTMLButtonElement>('#btnNuevaLane')?.disabled).toBeFalse();
  });

  it('inicio_cargaDiagramaYRoles', () => {
    const fixture = crear();
    const el: HTMLElement = fixture.nativeElement;
    expect(procesos.diagrama).toHaveBeenCalledWith(7);
    expect(el.querySelector('#tituloEditor')?.textContent).toContain('Vacaciones');
    expect(el.querySelector('#svgDiagrama')).not.toBeNull();
    expect(fixture.componentInstance.roles().length).toBe(1);
  });

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

  it('nuevaLane_sinPoolDeEmpresa_avisa', () => {
    const fixture = crear('ADMINISTRADOR', { ...diagramaEjemplo, pools: [diagramaEjemplo.pools[1]], lanes: [] });
    spyOn(TestBed.inject(NotificacionService), 'advertencia');
    fixture.componentInstance.nuevaLane();
    expect(fixture.componentInstance.formulario()).toBeNull();
    expect(TestBed.inject(NotificacionService).advertencia).toHaveBeenCalled();
  });

  it('nuevaLane_conPoolSeleccionado_usaEsePool', () => {
    const fixture = crear();
    fixture.componentInstance.seleccion.set({ tipo: 'lane', id: 11 });
    fixture.componentInstance.nuevaLane();
    expect(fixture.componentInstance.como('lane')?.poolId).toBe(1);
    fixture.componentInstance.seleccion.set({ tipo: 'pool', id: 2 });
    fixture.componentInstance.nuevaLane();
    expect(fixture.componentInstance.como('lane')?.poolId).toBe(2);
  });

  it('nuevoNodo_enLaneSeleccionada_precargaLaLane', () => {
    const fixture = crear();
    fixture.componentInstance.seleccion.set({ tipo: 'lane', id: 11 });
    fixture.componentInstance.nuevoNodo('evento');
    expect(fixture.componentInstance.como('evento')?.laneId).toBe(11);
    fixture.componentInstance.nuevoNodo('gateway', 10);
    expect(fixture.componentInstance.como('gateway')?.laneId).toBe(10);
    expect(fixture.componentInstance.como('actividad')).toBeNull();
  });

  it('alGuardar_cierraElFormularioYRecargaElDiagrama', () => {
    const fixture = crear();
    fixture.componentInstance.nuevoPool();
    fixture.componentInstance.alGuardar('Pool guardado.');
    expect(fixture.componentInstance.formulario()).toBeNull();
    expect(procesos.diagrama).toHaveBeenCalledTimes(2);
  });

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

  it('recargar_conSeleccionQueYaNoExiste_laQuita', () => {
    const fixture = crear();
    fixture.componentInstance.seleccion.set({ tipo: 'gateway', id: 102 });
    procesos.diagrama.and.returnValue(of({ ...diagramaEjemplo, gateways: [] }));
    fixture.componentInstance.recargar();
    expect(fixture.componentInstance.seleccion()).toBeNull();
  });

  it('recargar_conSeleccionVigente_laConserva', () => {
    const fixture = crear();
    fixture.componentInstance.seleccion.set({ tipo: 'pool', id: 1 });
    fixture.componentInstance.recargar();
    expect(fixture.componentInstance.seleccion()).toEqual({ tipo: 'pool', id: 1 });
  });

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

  it('alCambiarEstado_actualizaElProcesoDelModelo', () => {
    const fixture = crear();
    fixture.componentInstance.alCambiarEstado({ ...procesoBase, estado: 'PUBLICADO' });
    expect(fixture.componentInstance.datos()?.proceso.estado).toBe('PUBLICADO');
  });

  it('editorSinPermisoDeEliminar_noVeElBotonEliminar', () => {
    const fixture = crear('EDITOR');
    fixture.componentInstance.seleccion.set({ tipo: 'actividad', id: 100 });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#btnEditarElemento')).not.toBeNull();
    expect(el.querySelector('#btnEliminarElemento')).toBeNull();
  });
});
