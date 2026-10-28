import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { procesoBase } from '../testing/datos';
import { PageResponse } from '../models/pagina.model';
import { ProcesoCompartidoDetalleResponse, ProcesoCompartidoResponse } from '../models/proceso-compartido.model';
import { ProcesoDiagramaResponse, ProcesoResponse } from '../models/proceso.model';
import { TokenService } from '../service/token.service';
import { NotificacionService } from '../service/notificacion.service';
import { ProcesoCompartidoService } from '../service/proceso-compartido.service';
import { ProcesoService } from '../service/proceso.service';
import { CompartidoDetalleComponent } from './compartido-detalle/compartido-detalle.component';
import { CompartidosComponent } from './compartidos/compartidos.component';
import { ProcesoDetalleComponent } from './proceso-detalle/proceso-detalle.component';
import { ProcesoEdicionComponent } from './proceso-edicion/proceso-edicion.component';
import { ProcesosComponent } from './procesos/procesos.component';

function pagina(content: ProcesoResponse[], page = 0, totalPages = 1): PageResponse<ProcesoResponse> {
  return { content, page, size: 10, totalElements: content.length, totalPages };
}

function iniciarSesion(rol: 'ADMINISTRADOR' | 'EDITOR' | 'SOLO_LECTURA'): void {
  new TokenService().guardarSesion('t', { id: 1, nombre: 'U', email: 'u@d.com', rolAcceso: rol, activo: true });
}

const diagramaVacio: ProcesoDiagramaResponse = {
  proceso: procesoBase,
  pools: [],
  lanes: [],
  actividades: [],
  gateways: [],
  eventos: [],
  arcos: [],
  mensajes: []
};

describe('ProcesosComponent', () => {
  let servicio: jasmine.SpyObj<ProcesoService>;

  beforeEach(() => {
    localStorage.clear();
    iniciarSesion('ADMINISTRADOR');
    servicio = jasmine.createSpyObj<ProcesoService>('ProcesoService', ['listar', 'eliminar']);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: ProcesoService, useValue: servicio }]
    });
  });

  it('inicio_cargaLaPrimeraPagina', () => {
    servicio.listar.and.returnValue(of(pagina([procesoBase])));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    expect(servicio.listar).toHaveBeenCalledWith(jasmine.objectContaining({ pagina: 0 }));
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('#tablaProcesos tbody tr').length).toBe(1);
  });

  it('buscar_enviaLosFiltrosDelFormulario', () => {
    servicio.listar.and.returnValue(of(pagina([])));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    fixture.componentInstance.filtros.setValue({ nombre: ' vac ', categoria: 'RRHH', estado: 'PUBLICADO', visibilidad: 'false' });
    fixture.componentInstance.buscar();
    expect(servicio.listar).toHaveBeenCalledWith({ nombre: 'vac', categoria: 'RRHH', estado: 'PUBLICADO', activo: false, pagina: 0 });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se encontraron procesos');
  });

  it('limpiar_reiniciaLosFiltros', () => {
    servicio.listar.and.returnValue(of(pagina([])));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    fixture.componentInstance.filtros.controls.nombre.setValue('x');
    fixture.componentInstance.limpiar();
    expect(fixture.componentInstance.filtros.controls.nombre.value).toBe('');
  });

  it('cargar_conVariasPaginas_usaElPaginador', () => {
    servicio.listar.and.returnValue(of(pagina([procesoBase], 0, 3)));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#btnPaginaSiguiente')?.click();
    expect(servicio.listar).toHaveBeenCalledWith(jasmine.objectContaining({ pagina: 1 }));
  });

  it('cargar_error_muestraElMensaje', () => {
    servicio.listar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#alertaErrorProcesos')?.textContent).toContain('No se pudo conectar');
  });

  it('eliminar_confirmado_recargaCuandoElBackendResponde', () => {
    servicio.listar.and.returnValue(of(pagina([procesoBase])));
    servicio.eliminar.and.returnValue(of(undefined));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    fixture.componentInstance.pedirEliminar(procesoBase);
    servicio.listar.and.returnValue(of(pagina([])));
    fixture.componentInstance.confirmarEliminar();
    expect(servicio.eliminar).toHaveBeenCalledWith(7);
    expect(fixture.componentInstance.pagina()?.content.length).toBe(0);
    expect(fixture.componentInstance.procesoAEliminar()).toBeNull();
  });

  it('eliminar_ultimaFilaDePaginaPosterior_vuelveALaPaginaAnterior', () => {
    servicio.listar.and.returnValue(of(pagina([procesoBase], 2, 3)));
    servicio.eliminar.and.returnValue(of(undefined));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    fixture.componentInstance.pedirEliminar(procesoBase);
    fixture.componentInstance.confirmarEliminar();
    expect(servicio.listar).toHaveBeenCalledWith(jasmine.objectContaining({ pagina: 1 }));
  });

  it('eliminar_error_noQuitaLaFila', () => {
    servicio.listar.and.returnValue(of(pagina([procesoBase])));
    servicio.eliminar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403, error: { detail: 'Solo administrador' } })));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    fixture.componentInstance.pedirEliminar(procesoBase);
    fixture.componentInstance.confirmarEliminar();
    expect(fixture.componentInstance.pagina()?.content.length).toBe(1);
  });

  it('cancelarEliminar_yConfirmarSinSeleccion_noHacenNada', () => {
    servicio.listar.and.returnValue(of(pagina([procesoBase])));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    fixture.componentInstance.pedirEliminar(procesoBase);
    fixture.componentInstance.cancelarEliminar();
    fixture.componentInstance.confirmarEliminar();
    expect(servicio.eliminar).not.toHaveBeenCalled();
  });

  it('soloLectura_noVeElBotonNuevoProceso', () => {
    localStorage.clear();
    iniciarSesion('SOLO_LECTURA');
    servicio.listar.and.returnValue(of(pagina([])));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#btnNuevoProceso')).toBeNull();
  });
});

describe('ProcesoEdicionComponent', () => {
  let servicio: jasmine.SpyObj<ProcesoService>;
  let router: Router;

  function configurar(id?: string) {
    servicio = jasmine.createSpyObj<ProcesoService>('ProcesoService', ['obtener', 'crear', 'editar', 'cambiarEstado']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProcesoService, useValue: servicio },
        { provide: ActivatedRoute, useValue: { snapshot: { params: id ? { id } : {} } } }
      ]
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  }

  it('crear_usaElIdReal_ynavegaAlDetalle', () => {
    configurar();
    servicio.crear.and.returnValue(of({ ...procesoBase, id: 55 }));
    const fixture = TestBed.createComponent(ProcesoEdicionComponent);
    fixture.detectChanges();
    fixture.componentInstance.guardar({ nombre: 'n', descripcion: 'd', categoria: 'c' });
    expect(router.navigate).toHaveBeenCalledWith(['/procesos', 55]);
  });

  it('crear_error400_muestraErroresPorCampo', () => {
    configurar();
    servicio.crear.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'nombre: El nombre es obligatorio.' } })));
    const fixture = TestBed.createComponent(ProcesoEdicionComponent);
    fixture.detectChanges();
    fixture.componentInstance.guardar({ nombre: '', descripcion: 'd', categoria: 'c' });
    expect(fixture.componentInstance.errores()['nombre']).toBe('El nombre es obligatorio.');
    expect(fixture.componentInstance.enviando()).toBeFalse();
  });

  it('editar_cargaElProcesoYGuardaConPut', () => {
    configurar('7');
    servicio.obtener.and.returnValue(of({ proceso: procesoBase, historial: [] }));
    servicio.editar.and.returnValue(of(procesoBase));
    const fixture = TestBed.createComponent(ProcesoEdicionComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.proceso()?.nombre).toBe('Vacaciones');
    fixture.componentInstance.guardar({ nombre: 'n', descripcion: 'd', categoria: 'c' });
    expect(servicio.editar).toHaveBeenCalledWith(7, { nombre: 'n', descripcion: 'd', categoria: 'c' });
    expect(router.navigate).toHaveBeenCalledWith(['/procesos', 7]);
  });

  it('editar_procesoNoExiste_muestraElError404', () => {
    configurar('99');
    servicio.obtener.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'Proceso no encontrado.' } })));
    const fixture = TestBed.createComponent(ProcesoEdicionComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBe('Proceso no encontrado.');
    expect(fixture.componentInstance.cargando()).toBeFalse();
  });

  it('cancelar_vuelveAlListadoOAlDetalle', () => {
    configurar();
    const nuevo = TestBed.createComponent(ProcesoEdicionComponent);
    nuevo.componentInstance.cancelar();
    expect(router.navigate).toHaveBeenCalledWith(['/procesos']);
  });

  it('alCambiarEstado_actualizaElProceso', () => {
    configurar('7');
    servicio.obtener.and.returnValue(of({ proceso: procesoBase, historial: [] }));
    const fixture = TestBed.createComponent(ProcesoEdicionComponent);
    fixture.detectChanges();
    fixture.componentInstance.alCambiarEstado({ ...procesoBase, estado: 'PUBLICADO' });
    expect(fixture.componentInstance.proceso()?.estado).toBe('PUBLICADO');
  });
});

describe('ProcesoDetalleComponent', () => {
  let servicio: jasmine.SpyObj<ProcesoService>;

  beforeEach(() => {
    localStorage.clear();
    iniciarSesion('ADMINISTRADOR');
    servicio = jasmine.createSpyObj<ProcesoService>('ProcesoService', ['obtener', 'diagrama', 'historial']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        NotificacionService,
        { provide: ProcesoService, useValue: servicio },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: '7' } } } }
      ]
    });
  });

  it('inicio_encadenaDetalleYDiagramaConSwitchMap', () => {
    servicio.obtener.and.returnValue(of({ proceso: procesoBase, historial: [{ id: 1, fechaCambio: '2026-01-02T10:00:00', descripcionCambio: 'Creado', autorNombre: 'Admin' }] }));
    servicio.diagrama.and.returnValue(of(diagramaVacio));
    const fixture = TestBed.createComponent(ProcesoDetalleComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(servicio.diagrama).toHaveBeenCalledWith(7);
    expect(el.querySelector('#tituloProceso')?.textContent).toContain('Vacaciones');
    expect(el.querySelectorAll('#tablaHistorial tbody tr').length).toBe(1);
    expect(el.querySelector('#resumenDiagrama')).not.toBeNull();
  });

  it('inicio_error404_muestraElMensaje', () => {
    servicio.obtener.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'Proceso no encontrado.' } })));
    const fixture = TestBed.createComponent(ProcesoDetalleComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#alertaErrorDetalle')?.textContent).toContain('Proceso no encontrado.');
  });

  it('alCambiarEstado_actualizaYRecargaElHistorial', () => {
    servicio.obtener.and.returnValue(of({ proceso: procesoBase, historial: [] }));
    servicio.diagrama.and.returnValue(of(diagramaVacio));
    servicio.historial.and.returnValue(of([{ id: 2, fechaCambio: '2026-01-03T10:00:00', descripcionCambio: 'Proceso publicado.', autorNombre: 'Admin' }]));
    const fixture = TestBed.createComponent(ProcesoDetalleComponent);
    fixture.detectChanges();
    fixture.componentInstance.alCambiarEstado({ ...procesoBase, estado: 'PUBLICADO' });
    expect(fixture.componentInstance.historial().length).toBe(1);
    expect(fixture.componentInstance.proceso()?.estado).toBe('PUBLICADO');
  });

  it('alCambiarEstado_errorAlRecargarHistorial_noRompe', () => {
    servicio.obtener.and.returnValue(of({ proceso: procesoBase, historial: [] }));
    servicio.diagrama.and.returnValue(of(diagramaVacio));
    servicio.historial.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const fixture = TestBed.createComponent(ProcesoDetalleComponent);
    fixture.detectChanges();
    fixture.componentInstance.alCambiarEstado(procesoBase);
    expect(fixture.componentInstance.historial().length).toBe(0);
  });
});

describe('CompartidosComponent y CompartidoDetalleComponent', () => {
  const compartido: ProcesoCompartidoResponse = {
    id: 3,
    procesoId: 9,
    procesoNombre: 'Pedidos',
    empresaPropietariaId: 2,
    empresaPropietaria: 'Otra S.A.',
    empresaInvitadaId: 1,
    empresaInvitada: 'Demo',
    soloLectura: true
  };
  let servicio: jasmine.SpyObj<ProcesoCompartidoService>;

  beforeEach(() => {
    servicio = jasmine.createSpyObj<ProcesoCompartidoService>('ProcesoCompartidoService', ['listarRecibidos', 'detalle']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProcesoCompartidoService, useValue: servicio },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: '9' } } } }
      ]
    });
  });

  it('listado_muestraLosProcesosRecibidosEnSoloLectura', () => {
    servicio.listarRecibidos.and.returnValue(of([compartido]));
    const fixture = TestBed.createComponent(CompartidosComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#filaCompartido3')?.textContent).toContain('Solo lectura');
  });

  it('listado_vacio_muestraEstadoVacio', () => {
    servicio.listarRecibidos.and.returnValue(of([]));
    const fixture = TestBed.createComponent(CompartidosComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ninguna empresa');
  });

  it('listado_error_muestraElMensaje', () => {
    servicio.listarRecibidos.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const fixture = TestBed.createComponent(CompartidosComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toContain('No se pudo conectar');
  });

  it('detalle_muestraLaInsigniaDeSoloLectura', () => {
    const detalle: ProcesoCompartidoDetalleResponse = { ...diagramaVacio, empresaPropietaria: 'Otra S.A.', soloLectura: true };
    servicio.detalle.and.returnValue(of(detalle));
    const fixture = TestBed.createComponent(CompartidoDetalleComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#badgeSoloLectura')).not.toBeNull();
  });

  it('detalle_error404_muestraElMensaje', () => {
    servicio.detalle.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'Proceso compartido no encontrado.' } })));
    const fixture = TestBed.createComponent(CompartidoDetalleComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#alertaErrorCompartido')?.textContent).toContain('no encontrado');
  });
});
