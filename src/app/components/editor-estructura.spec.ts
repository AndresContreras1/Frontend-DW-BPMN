// =====================================================================================
// editor-estructura.spec.ts
// Pruebas de los formularios y paneles de ESTRUCTURA del editor BPMN: pool, lane, actividad, gateway,
// confirmación de eliminación y panel de acciones. Técnica común: se reemplaza cada servicio HTTP por un
// 'spy' de Jasmine (createSpyObj) inyectado con TestBed, de modo que NO hay red real: se verifica qué se
// llama al servicio y qué muestra/emite el componente. Los datos salen de testing/datos (diagramaEjemplo).
// =====================================================================================
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActividadResponse } from '../models/actividad.model';
import { GatewayResponse } from '../models/gateway.model';
import { LaneResponse } from '../models/lane.model';
import { PermisoEstructuraResponse } from '../models/permiso-estructura.model';
import { PoolResponse } from '../models/pool.model';
import { RolProcesoVistaResponse } from '../models/rol-proceso.model';
import { SeleccionDiagrama } from '../models/seleccion-diagrama.model';
import { ActividadService } from '../service/actividad.service';
import { ArcoService } from '../service/arco.service';
import { EventoMensajeService } from '../service/evento-mensaje.service';
import { GatewayService } from '../service/gateway.service';
import { LaneService } from '../service/lane.service';
import { MensajeService } from '../service/mensaje.service';
import { PoolService } from '../service/pool.service';
import { diagramaEjemplo } from '../testing/datos';
import { sugerirPosicion } from '../utils/posicion';
import { ActividadFormComponent } from './actividad-form/actividad-form.component';
import { EliminarElementoComponent } from './eliminar-elemento/eliminar-elemento.component';
import { GatewayFormComponent } from './gateway-form/gateway-form.component';
import { LaneFormComponent } from './lane-form/lane-form.component';
import { PanelElementoComponent, ReordenLanes } from './panel-elemento/panel-elemento.component';
import { PoolFormComponent } from './pool-form/pool-form.component';

// Fabrica un error HTTP 409 (conflicto) con el formato ProblemDetail del backend ({ detail }): simula reglas rotas (nombre duplicado, etc.).
const error409 = (detail: string) => new HttpErrorResponse({ status: 409, error: { detail } });
const datos = diagramaEjemplo;

// Utilidad pura que propone una posición libre (x, y) dentro de una lane para no encimar nodos nuevos.
describe('sugerirPosicion', () => {
  // Sin nodos en la lane, la primera posición es la inicial (80, 60).
  it('laneVacia_empiezaEnLaPosicionInicial', () => {
    expect(sugerirPosicion({ ...datos, actividades: [], gateways: [], eventos: [] }, 10)).toEqual({ x: 80, y: 60 });
  });

  // Con nodos existentes, la nueva posición queda a la derecha del último nodo de la lane.
  it('laneConNodos_proponeAlaDerechaDelUltimo', () => {
    expect(sugerirPosicion(datos, 11)).toEqual({ x: 720, y: 60 });
  });
});

// Formulario de pool. El servicio de pools se simula; se prueban crear, editar, validación y manejo de error.
describe('PoolFormComponent', () => {
  let pools: jasmine.SpyObj<PoolService>;
  const pool: PoolResponse = datos.pools[0];

  beforeEach(() => {
    pools = jasmine.createSpyObj<PoolService>('PoolService', ['crear', 'editar']);
    TestBed.configureTestingModule({ providers: [{ provide: PoolService, useValue: pools }] });
  });

  // Crea el componente dando sus inputs con setInput (modo crear si 'actual' es null) y ejecuta el primer ciclo de detección de cambios.
  function crear(actual: PoolResponse | null = null) {
    const fixture = TestBed.createComponent(PoolFormComponent);
    fixture.componentRef.setInput('procesoId', 7);
    fixture.componentRef.setInput('pool', actual);
    fixture.detectChanges();
    return fixture;
  }

  // Al crear: el nombre se recorta (trim), se llama a crear(procesoId, datos) y se emite por el Output 'guardado' el pool devuelto.
  it('crear_enviaElPoolAlProcesoYEmiteElCreado', () => {
    pools.crear.and.returnValue(of(pool));
    const fixture = crear();
    let emitido: PoolResponse | undefined;
    fixture.componentInstance.guardado.subscribe((p) => (emitido = p));
    fixture.componentInstance.form.setValue({ nombre: ' Banco ', tipoParticipante: 'SISTEMA_EXTERNO', cajaNegra: true });
    fixture.componentInstance.guardar();
    expect(pools.crear).toHaveBeenCalledWith(7, { nombre: 'Banco', tipoParticipante: 'SISTEMA_EXTERNO', cajaNegra: true });
    expect(emitido).toEqual(pool);
  });

  // Al editar: el formulario se precarga con el pool y se llama a editar(id, ...) en lugar de crear.
  it('editar_precargaYUsaPut', () => {
    pools.editar.and.returnValue(of(pool));
    const fixture = crear(pool);
    expect(fixture.componentInstance.form.getRawValue().nombre).toBe('Empresa Demo');
    fixture.componentInstance.guardar();
    expect(pools.editar).toHaveBeenCalledWith(1, jasmine.objectContaining({ nombre: 'Empresa Demo' }));
  });

  // Con el nombre vacío (obligatorio) el formulario es inválido y no se llama al backend.
  it('formularioInvalido_noLlamaAlBackend', () => {
    const fixture = crear();
    fixture.componentInstance.guardar();
    expect(pools.crear).not.toHaveBeenCalled();
  });

  // Si el backend responde 409, se muestra el mensaje en la alerta y NO se emite 'guardado'.
  it('errorDelBackend_seMuestraYNoEmite', () => {
    pools.crear.and.returnValue(throwError(() => error409('Ya existe un pool con ese nombre.')));
    const fixture = crear();
    let emitido = false;
    fixture.componentInstance.guardado.subscribe(() => (emitido = true));
    fixture.componentInstance.form.patchValue({ nombre: 'X' });
    fixture.componentInstance.guardar();
    fixture.detectChanges();
    expect(emitido).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).querySelector('#alertaErrorPool')?.textContent).toContain('Ya existe un pool');
  });

  // El botón Cancelar emite el Output 'cancelar' para que el padre cierre el formulario.
  it('cancelar_emiteElEvento', () => {
    const fixture = crear();
    let cancelado = false;
    fixture.componentInstance.cancelar.subscribe(() => (cancelado = true));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#btnCancelarPool')?.click();
    expect(cancelado).toBeTrue();
  });
});

// Formulario de lane: su responsable es un rol de proceso del catálogo.
describe('LaneFormComponent', () => {
  let lanes: jasmine.SpyObj<LaneService>;
  const roles: RolProcesoVistaResponse[] = [{ id: 5, nombre: 'Analista', procesosQueLoUsan: 0, enUso: false }];
  const lane: LaneResponse = datos.lanes[0];

  beforeEach(() => {
    lanes = jasmine.createSpyObj<LaneService>('LaneService', ['crear', 'editar']);
    TestBed.configureTestingModule({ providers: [{ provide: LaneService, useValue: lanes }] });
  });

  function crear(actual: LaneResponse | null = null, lista = roles) {
    const fixture = TestBed.createComponent(LaneFormComponent);
    fixture.componentRef.setInput('poolId', 1);
    fixture.componentRef.setInput('lane', actual);
    fixture.componentRef.setInput('roles', lista);
    fixture.detectChanges();
    return fixture;
  }

  // Al crear se preselecciona el primer rol y la lane se envía al pool indicado (rolProcesoId llega como número).
  it('crear_preseleccionaElPrimerRolYEnviaAlPool', () => {
    lanes.crear.and.returnValue(of(lane));
    const fixture = crear();
    fixture.componentInstance.form.patchValue({ nombre: 'Nueva' });
    fixture.componentInstance.guardar();
    expect(lanes.crear).toHaveBeenCalledWith(1, { nombre: 'Nueva', rolProcesoId: 5 });
  });

  // Al editar se usa el id de la lane y se conservan nombre y rol.
  it('editar_usaPutConElIdDeLaLane', () => {
    lanes.editar.and.returnValue(of(lane));
    const fixture = crear(lane);
    fixture.componentInstance.guardar();
    expect(lanes.editar).toHaveBeenCalledWith(10, { nombre: 'Empleado', rolProcesoId: 1 });
  });

  // Sin roles de proceso se muestra el aviso y no se puede guardar.
  it('sinRoles_avisaQueHayQueCrearUno', () => {
    const fixture = crear(null, []);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No hay roles de proceso');
    fixture.componentInstance.guardar();
    expect(lanes.crear).not.toHaveBeenCalled();
  });

  // Un error del backend (p. ej. pool de caja negra, que no admite lanes) queda en la señal 'error'.
  it('errorDelBackend_seMuestra', () => {
    lanes.crear.and.returnValue(throwError(() => error409('El pool es caja negra.')));
    const fixture = crear();
    fixture.componentInstance.form.patchValue({ nombre: 'N' });
    fixture.componentInstance.guardar();
    expect(fixture.componentInstance.error()).toBe('El pool es caja negra.');
  });
});

// Formulario de actividad: nombre único, tipo, lane (responsable) y posición relativa a la lane.
describe('ActividadFormComponent', () => {
  let actividades: jasmine.SpyObj<ActividadService>;
  const actividad: ActividadResponse = datos.actividades[0];

  beforeEach(() => {
    actividades = jasmine.createSpyObj<ActividadService>('ActividadService', ['crear', 'editar']);
    TestBed.configureTestingModule({ providers: [{ provide: ActividadService, useValue: actividades }] });
  });

  function crear(actual: ActividadResponse | null = null, laneInicial?: number) {
    const fixture = TestBed.createComponent(ActividadFormComponent);
    fixture.componentRef.setInput('datos', datos);
    fixture.componentRef.setInput('actividad', actual);
    fixture.componentRef.setInput('laneInicial', laneInicial);
    fixture.detectChanges();
    return fixture;
  }

  // Al crear en la lane 11 se sugiere la posición (720) a la derecha del último nodo y se envía a esa lane.
  it('crear_proponeLaPosicionYEnviaALaLaneElegida', () => {
    actividades.crear.and.returnValue(of(actividad));
    const fixture = crear(null, 11);
    expect(fixture.componentInstance.form.controls.posicionX.value).toBe('720');
    fixture.componentInstance.form.patchValue({ nombre: 'Pagar', tipoActividad: 'SERVICIO' });
    fixture.componentInstance.guardar();
    expect(actividades.crear).toHaveBeenCalledWith(11, jasmine.objectContaining({ nombre: 'Pagar', tipoActividad: 'SERVICIO', laneId: 11, posicionX: 720 }));
  });

  // Al cambiar de lane durante la creación se recalcula la posición libre en la nueva lane.
  it('alCambiarLane_alCrear_recalculaLaPosicion', () => {
    const fixture = crear(null, 11);
    fixture.componentInstance.form.patchValue({ laneId: '10' });
    fixture.componentInstance.alCambiarLane();
    expect(fixture.componentInstance.form.controls.posicionX.value).toBe('240');
  });

  // Regla de negocio: cambiar la lane de una actividad equivale a cambiar su responsable. Al editar NO se recalcula la posición (se conserva 80).
  it('editar_moverDeLaneEsCambiarElResponsable', () => {
    actividades.editar.and.returnValue(of({ ...actividad, laneId: 11 }));
    const fixture = crear(actividad);
    fixture.componentInstance.form.patchValue({ laneId: '11' });
    fixture.componentInstance.alCambiarLane();
    fixture.componentInstance.guardar();
    expect(actividades.editar).toHaveBeenCalledWith(100, jasmine.objectContaining({ laneId: 11, posicionX: 80 }));
  });

  // La posición debe ser un entero no negativo (validador pattern): 'abc' invalida el formulario.
  it('posicionNoNumerica_haceInvalidoElFormulario', () => {
    const fixture = crear(null, 10);
    fixture.componentInstance.form.patchValue({ nombre: 'A', posicionX: 'abc' });
    fixture.componentInstance.guardar();
    expect(actividades.crear).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.posicionX.invalid).toBeTrue();
  });

  // El nombre de la actividad es único en el proceso: el 409 del backend se muestra al usuario.
  it('nombreDuplicado_muestraElErrorDelBackend', () => {
    actividades.crear.and.returnValue(throwError(() => error409('Ya existe una actividad con ese nombre.')));
    const fixture = crear(null, 10);
    fixture.componentInstance.form.patchValue({ nombre: 'Radicar solicitud de vacaciones' });
    fixture.componentInstance.guardar();
    expect(fixture.componentInstance.error()).toContain('Ya existe una actividad');
  });
});

// Formulario de gateway (exclusivo, paralelo o inclusivo).
describe('GatewayFormComponent', () => {
  let gateways: jasmine.SpyObj<GatewayService>;
  const gateway: GatewayResponse = datos.gateways[0];

  beforeEach(() => {
    gateways = jasmine.createSpyObj<GatewayService>('GatewayService', ['crear', 'editar']);
    TestBed.configureTestingModule({ providers: [{ provide: GatewayService, useValue: gateways }] });
  });

  function crear(actual: GatewayResponse | null = null) {
    const fixture = TestBed.createComponent(GatewayFormComponent);
    fixture.componentRef.setInput('datos', datos);
    fixture.componentRef.setInput('gateway', actual);
    fixture.detectChanges();
    return fixture;
  }

  // Se crea un gateway paralelo en la lane 10 con la posición sugerida (240, 60).
  it('crear_enviaTipoYPosicionALaLane', () => {
    gateways.crear.and.returnValue(of(gateway));
    const fixture = crear();
    fixture.componentInstance.form.patchValue({ nombre: 'Decide', tipoGateway: 'PARALELO', laneId: '10' });
    fixture.componentInstance.alCambiarLane();
    fixture.componentInstance.guardar();
    expect(gateways.crear).toHaveBeenCalledWith(10, { nombre: 'Decide', tipoGateway: 'PARALELO', posicionX: 240, posicionY: 60, laneId: 10 });
  });

  // Pasar un gateway a PARALELO muestra un aviso: el backend borra las condiciones de sus arcos salientes.
  it('editar_pasarAParaleloAvisaQueSeLimpianLasCondiciones', () => {
    gateways.editar.and.returnValue(of({ ...gateway, tipoGateway: 'PARALELO' }));
    const fixture = crear(gateway);
    expect(fixture.componentInstance.avisaLimpiezaDeCondiciones()).toBeFalse();
    fixture.componentInstance.form.patchValue({ tipoGateway: 'PARALELO' });
    fixture.detectChanges();
    expect(fixture.componentInstance.avisaLimpiezaDeCondiciones()).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).querySelector('#avisoParalelo')).not.toBeNull();
    fixture.componentInstance.guardar();
    expect(gateways.editar).toHaveBeenCalledWith(102, jasmine.objectContaining({ tipoGateway: 'PARALELO' }));
  });

  // El campo lane sigue habilitado al editar y el nuevo laneId viaja en la petición (mover el gateway de lane).
  it('editar_moverDeLaneEnviaElLaneId', () => {
    gateways.editar.and.returnValue(of(gateway));
    const fixture = crear(gateway);
    expect(fixture.componentInstance.form.controls.laneId.enabled).toBeTrue();
    fixture.componentInstance.form.patchValue({ laneId: '10' });
    fixture.componentInstance.alCambiarLane();
    fixture.componentInstance.guardar();
    expect(gateways.editar).toHaveBeenCalledWith(102, jasmine.objectContaining({ laneId: 10 }));
  });

  // Sin nombre no se llama al backend; con nombre, el error 409 del backend se refleja en 'error'.
  it('formularioInvalidoYErrorDelBackend', () => {
    gateways.crear.and.returnValue(throwError(() => error409('Nombre duplicado.')));
    const fixture = crear();
    fixture.componentInstance.guardar();
    expect(gateways.crear).not.toHaveBeenCalled();
    fixture.componentInstance.form.patchValue({ nombre: 'G' });
    fixture.componentInstance.guardar();
    expect(fixture.componentInstance.error()).toBe('Nombre duplicado.');
  });
});

// Confirmación de eliminación: consulta el impacto (solo actividad, gateway y arco) y elimina con el servicio del tipo correcto.
describe('EliminarElementoComponent', () => {
  let actividades: jasmine.SpyObj<ActividadService>;
  let gateways: jasmine.SpyObj<GatewayService>;
  let arcos: jasmine.SpyObj<ArcoService>;
  let pools: jasmine.SpyObj<PoolService>;
  let lanes: jasmine.SpyObj<LaneService>;
  let eventos: jasmine.SpyObj<EventoMensajeService>;
  let mensajes: jasmine.SpyObj<MensajeService>;

  beforeEach(() => {
    actividades = jasmine.createSpyObj<ActividadService>('ActividadService', ['impactoEliminacion', 'eliminar']);
    gateways = jasmine.createSpyObj<GatewayService>('GatewayService', ['impactoEliminacion', 'eliminar']);
    arcos = jasmine.createSpyObj<ArcoService>('ArcoService', ['impactoEliminacion', 'eliminar']);
    pools = jasmine.createSpyObj<PoolService>('PoolService', ['eliminar']);
    lanes = jasmine.createSpyObj<LaneService>('LaneService', ['eliminar']);
    eventos = jasmine.createSpyObj<EventoMensajeService>('EventoMensajeService', ['eliminar']);
    mensajes = jasmine.createSpyObj<MensajeService>('MensajeService', ['eliminar']);
    TestBed.configureTestingModule({
      providers: [
        { provide: ActividadService, useValue: actividades },
        { provide: GatewayService, useValue: gateways },
        { provide: ArcoService, useValue: arcos },
        { provide: PoolService, useValue: pools },
        { provide: LaneService, useValue: lanes },
        { provide: EventoMensajeService, useValue: eventos },
        { provide: MensajeService, useValue: mensajes }
      ]
    });
  });

  // Crea el componente con el elemento a eliminar y ejecuta ngOnInit (que consulta el impacto).
  function crear(elemento: SeleccionDiagrama) {
    const fixture = TestBed.createComponent(EliminarElementoComponent);
    fixture.componentRef.setInput('datos', datos);
    fixture.componentRef.setInput('elemento', elemento);
    fixture.detectChanges();
    return fixture;
  }

  // Antes de confirmar se muestran las advertencias de impacto (p. ej. un nodo quedaría sin entrada) y el nombre del elemento.
  it('actividad_muestraLasAdvertenciasDeImpactoAntesDeConfirmar', () => {
    actividades.impactoEliminacion.and.returnValue(of({ requiereConfirmacion: true, rompeContinuidad: true, advertencias: ['El nodo Revisar quedará sin entrada.'] }));
    const fixture = crear({ tipo: 'actividad', id: 100 });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#listaAdvertencias')?.textContent).toContain('quedará sin entrada');
    expect(fixture.componentInstance.nombre()).toBe('Radicar solicitud de vacaciones');
  });

  // Confirmar llama a eliminar con el id correcto y emite 'eliminado'.
  it('confirmar_eliminaYEmite', () => {
    gateways.impactoEliminacion.and.returnValue(of({ requiereConfirmacion: false, rompeContinuidad: false, advertencias: [] }));
    gateways.eliminar.and.returnValue(of(undefined));
    const fixture = crear({ tipo: 'gateway', id: 102 });
    let eliminado = false;
    fixture.componentInstance.eliminado.subscribe(() => (eliminado = true));
    fixture.componentInstance.confirmar();
    expect(gateways.eliminar).toHaveBeenCalledWith(102);
    expect(eliminado).toBeTrue();
  });

  // Los arcos también consultan impacto (quedaría un nodo sin salida) antes de eliminarse.
  it('arco_consultaImpactoYElimina', () => {
    arcos.impactoEliminacion.and.returnValue(of({ requiereConfirmacion: true, rompeContinuidad: false, advertencias: ['Quedará sin salida'] }));
    arcos.eliminar.and.returnValue(of(undefined));
    const fixture = crear({ tipo: 'arco', id: 200 });
    fixture.componentInstance.confirmar();
    expect(arcos.eliminar).toHaveBeenCalledWith(200);
  });

  // Pool, lane, evento y mensaje se eliminan directamente, sin consulta de impacto (esos spies ni siquiera tienen impactoEliminacion).
  it('poolLaneEventoMensaje_eliminanSinConsultarImpacto', () => {
    pools.eliminar.and.returnValue(of(undefined));
    lanes.eliminar.and.returnValue(of(undefined));
    eventos.eliminar.and.returnValue(of(undefined));
    mensajes.eliminar.and.returnValue(of(undefined));
    crear({ tipo: 'pool', id: 1 }).componentInstance.confirmar();
    crear({ tipo: 'lane', id: 10 }).componentInstance.confirmar();
    crear({ tipo: 'evento', id: 103 }).componentInstance.confirmar();
    crear({ tipo: 'mensaje', id: 300 }).componentInstance.confirmar();
    expect(pools.eliminar).toHaveBeenCalledWith(1);
    expect(lanes.eliminar).toHaveBeenCalledWith(10);
    expect(eventos.eliminar).toHaveBeenCalledWith(103);
    expect(mensajes.eliminar).toHaveBeenCalledWith(300);
  });

  // Si el backend rechaza (lane con actividades), no se emite 'eliminado', el motivo aparece en el mensaje y se libera 'procesando'.
  it('laneConActividades_elBackendRechazaYSeMuestraElMotivo', () => {
    lanes.eliminar.and.returnValue(throwError(() => error409('La lane contiene actividades.')));
    const fixture = crear({ tipo: 'lane', id: 10 });
    let eliminado = false;
    fixture.componentInstance.eliminado.subscribe(() => (eliminado = true));
    fixture.componentInstance.confirmar();
    expect(eliminado).toBeFalse();
    expect(fixture.componentInstance.mensaje()).toContain('La lane contiene actividades.');
    expect(fixture.componentInstance.procesando()).toBeFalse();
  });

  // Si falla la consulta de impacto (404), se muestra el error y no hay advertencias.
  it('errorAlConsultarImpacto_seMuestra', () => {
    actividades.impactoEliminacion.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'No existe.' } })));
    const fixture = crear({ tipo: 'actividad', id: 100 });
    expect(fixture.componentInstance.error()).toBe('No existe.');
    expect(fixture.componentInstance.advertencias()).toEqual([]);
  });
});

// Permisos de estructura de prueba: administrador con todo permitido y (abajo) un editor sin ningún permiso de estructura.
const permisosTodos: PermisoEstructuraResponse = { rolAcceso: 'ADMINISTRADOR', crearPool: true, editarPool: true, eliminarPool: true, crearLane: true, editarLane: true, eliminarLane: true };
const sinPermisos: PermisoEstructuraResponse = { rolAcceso: 'EDITOR', crearPool: false, editarPool: false, eliminarPool: false, crearLane: false, editarLane: false, eliminarLane: false };

// Panel de acciones del editor: qué botones aparecen según la selección, el rol y los permisos de estructura.
describe('PanelElementoComponent', () => {
  // Crea el panel con selección, bandera de edición, rol y permisos configurables (por defecto: administrador con todo).
  function crear(seleccion: SeleccionDiagrama | null, puedeEditar = true, esAdministrador = true, permisos: PermisoEstructuraResponse | null = permisosTodos) {
    const fixture = TestBed.createComponent(PanelElementoComponent);
    fixture.componentRef.setInput('datos', datos);
    fixture.componentRef.setInput('seleccion', seleccion);
    fixture.componentRef.setInput('puedeEditar', puedeEditar);
    fixture.componentRef.setInput('esAdministrador', esAdministrador);
    fixture.componentRef.setInput('permisos', permisos);
    fixture.detectChanges();
    return fixture;
  }

  // Sin elemento seleccionado no hay botones de acción.
  it('sinSeleccion_noMuestraAcciones', () => {
    expect((crear(null).nativeElement as HTMLElement).querySelector('#accionesElemento')).toBeNull();
  });

  // Con el proceso en solo lectura no aparecen Editar ni Eliminar.
  it('soloLectura_noMuestraEditarNiEliminar', () => {
    const el: HTMLElement = crear({ tipo: 'actividad', id: 100 }, false, false).nativeElement;
    expect(el.querySelector('#btnEditarElemento')).toBeNull();
    expect(el.querySelector('#btnEliminarElemento')).toBeNull();
  });

  // Un no administrador puede editar una actividad pero no eliminarla (eliminar nodos es del administrador).
  it('editorSinPermisoDeEliminar_veSoloEditar', () => {
    const el: HTMLElement = crear({ tipo: 'actividad', id: 100 }, true, false).nativeElement;
    expect(el.querySelector('#btnEditarElemento')).not.toBeNull();
    expect(el.querySelector('#btnEliminarElemento')).toBeNull();
  });

  // Los botones Editar y Eliminar emiten sus Output con la selección, en ese orden.
  it('botonesEmitenLaSeleccion', () => {
    const fixture = crear({ tipo: 'gateway', id: 102 });
    const eventos: string[] = [];
    fixture.componentInstance.editar.subscribe(() => eventos.push('editar'));
    fixture.componentInstance.eliminar.subscribe(() => eventos.push('eliminar'));
    const el: HTMLElement = fixture.nativeElement;
    el.querySelector<HTMLButtonElement>('#btnEditarElemento')?.click();
    el.querySelector<HTMLButtonElement>('#btnEliminarElemento')?.click();
    expect(eventos).toEqual(['editar', 'eliminar']);
  });

  // Con un pool: botón de agregar lane, lista de sus lanes y reordenamiento (bajar la primera emite el nuevo orden [11, 10]; la primera no puede subir).
  it('pool_ofreceAgregarLaneYReordenarLanes', () => {
    const fixture = crear({ tipo: 'pool', id: 1 });
    const el: HTMLElement = fixture.nativeElement;
    let poolNueva = 0;
    let orden: ReordenLanes | undefined;
    fixture.componentInstance.nuevaLane.subscribe((id) => (poolNueva = id));
    fixture.componentInstance.reordenar.subscribe((o) => (orden = o));
    el.querySelector<HTMLButtonElement>('#btnNuevaLaneEnPool')?.click();
    expect(poolNueva).toBe(1);
    expect(el.querySelectorAll('#listaLanesPool li').length).toBe(2);
    el.querySelector<HTMLButtonElement>('#btnBajarLane10')?.click();
    expect(orden).toEqual({ poolId: 1, laneIds: [11, 10] });
    expect(el.querySelector<HTMLButtonElement>('#btnSubirLane10')?.disabled).toBeTrue();
    fixture.componentInstance.mover(datos.lanes[0], -1);
  });

  // Sin permisos de estructura no se puede editar, eliminar, agregar ni reordenar pools y lanes.
  it('editorSinPermisosDeEstructura_noEditaNiEliminaPoolsNiLanes', () => {
    for (const sel of [{ tipo: 'pool', id: 1 }, { tipo: 'lane', id: 10 }] as SeleccionDiagrama[]) {
      const el: HTMLElement = crear(sel, true, false, sinPermisos).nativeElement;
      expect(el.querySelector('#btnEditarElemento')).toBeNull();
      expect(el.querySelector('#btnEliminarElemento')).toBeNull();
      expect(el.querySelector('#btnNuevaLaneEnPool')).toBeNull();
      expect(el.querySelector('#btnSubirLane10')).toBeNull();
    }
  });

  // Con permisos concretos se habilita solo lo permitido: editar/eliminar pool y editar lane, pero no eliminar la lane ni la actividad.
  it('editorConPermisoDeEstructura_editaPoolsYLanesPeroNoEliminaLoDemas', () => {
    const permisos = { ...sinPermisos, editarPool: true, eliminarPool: true, editarLane: true };
    const pool: HTMLElement = crear({ tipo: 'pool', id: 1 }, true, false, permisos).nativeElement;
    expect(pool.querySelector('#btnEditarElemento')).not.toBeNull();
    expect(pool.querySelector('#btnEliminarElemento')).not.toBeNull();
    const lane: HTMLElement = crear({ tipo: 'lane', id: 10 }, true, false, permisos).nativeElement;
    expect(lane.querySelector('#btnEliminarElemento')).toBeNull();
    const actividad: HTMLElement = crear({ tipo: 'actividad', id: 100 }, true, false, permisos).nativeElement;
    expect(actividad.querySelector('#btnEliminarElemento')).toBeNull();
  });

  // Mientras los permisos son null (aún no cargan) se asume que no hay permiso.
  it('sinPermisosCargados_seTrataComoSinPermiso', () => {
    const el: HTMLElement = crear({ tipo: 'pool', id: 1 }, true, false, null).nativeElement;
    expect(el.querySelector('#btnEditarElemento')).toBeNull();
  });

  // Un pool de caja negra (participante externo sin detalle) no admite lanes: no se ofrece agregarlas.
  it('poolCajaNegra_noOfreceAgregarLane', () => {
    const el: HTMLElement = crear({ tipo: 'pool', id: 2 }).nativeElement;
    expect(el.querySelector('#btnNuevaLaneEnPool')).toBeNull();
  });

  // Con una lane: botones para agregar actividad, gateway y evento (emiten el tipo); y desde la lista de lanes de un pool se puede seleccionar una lane.
  it('lane_ofreceAgregarNodosYSeleccionDesdeLaLista', () => {
    const fixture = crear({ tipo: 'lane', id: 10 });
    const nodos: { tipo: string; laneId: number }[] = [];
    fixture.componentInstance.nuevoNodo.subscribe((n) => nodos.push(n));
    const el: HTMLElement = fixture.nativeElement;
    el.querySelector<HTMLButtonElement>('#btnNuevaActividadEnLane')?.click();
    el.querySelector<HTMLButtonElement>('#btnNuevoGatewayEnLane')?.click();
    el.querySelector<HTMLButtonElement>('#btnNuevoEventoEnLane')?.click();
    expect(nodos.map((n) => n.tipo)).toEqual(['actividad', 'gateway', 'evento']);

    const pool = crear({ tipo: 'pool', id: 1 });
    let elegida: SeleccionDiagrama | undefined;
    pool.componentInstance.seleccionar.subscribe((s) => (elegida = s));
    (pool.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#btnVerLane11')?.click();
    expect(elegida).toEqual({ tipo: 'lane', id: 11 });
  });
});
