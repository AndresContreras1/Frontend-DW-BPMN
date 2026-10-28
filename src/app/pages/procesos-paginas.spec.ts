// Pruebas unitarias de las páginas de procesos: lista (HU-04, HU-06), edición/creación (HU-04, HU-05), detalle (HU-07) y procesos compartidos (HU-23).
// Técnica común: ProcesoService / ProcesoCompartidoService se sustituyen por espías de Jasmine (createSpyObj); of(...) simula un éxito del backend
// y throwError(() => new HttpErrorResponse({status, error:{detail}})) simula un fallo con ProblemDetail. El Router se simula con provideRouter([]).
// Se valida la estrategia pesimista: el estado de la pantalla solo cambia cuando el servicio responde OK.
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

// Fábrica de una página del backend (PageResponse) para simular paginación.
function pagina(content: ProcesoResponse[], page = 0, totalPages = 1): PageResponse<ProcesoResponse> {
  return { content, page, size: 10, totalElements: content.length, totalPages };
}

// Guarda una sesión falsa con el rol de ACCESO indicado; así AuthService.puedeEditar()/esAdministrador() responden como en producción.
function iniciarSesion(rol: 'ADMINISTRADOR' | 'EDITOR' | 'SOLO_LECTURA'): void {
  new TokenService().guardarSesion('t', { id: 1, nombre: 'U', email: 'u@d.com', rolAcceso: rol, activo: true });
}

// Diagrama sin elementos: sirve de respuesta mínima para el detalle del proceso.
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

// Pruebas de la lista de procesos (HU-04, HU-06).
describe('ProcesosComponent', () => {
  let servicio: jasmine.SpyObj<ProcesoService>;

  // Antes de cada prueba: limpia el almacenamiento, inicia sesión como ADMINISTRADOR y registra el espía de ProcesoService.
  beforeEach(() => {
    localStorage.clear();
    iniciarSesion('ADMINISTRADOR');
    servicio = jasmine.createSpyObj<ProcesoService>('ProcesoService', ['listar', 'eliminar']);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: ProcesoService, useValue: servicio }]
    });
  });

  // Valida que al abrir la página se pide la página 0 y se pinta una fila por proceso.
  it('inicio_cargaLaPrimeraPagina', () => {
    servicio.listar.and.returnValue(of(pagina([procesoBase])));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    expect(servicio.listar).toHaveBeenCalledWith(jasmine.objectContaining({ pagina: 0 }));
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('#tablaProcesos tbody tr').length).toBe(1);
  });

  // Valida que los filtros se envían normalizados (trim, estado, activo=false para eliminados, página 0) y que sin resultados se muestra el estado vacío.
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

  // Valida que Limpiar devuelve los campos del formulario reactivo a vacío.
  it('limpiar_reiniciaLosFiltros', () => {
    servicio.listar.and.returnValue(of(pagina([])));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    fixture.componentInstance.filtros.controls.nombre.setValue('x');
    fixture.componentInstance.limpiar();
    expect(fixture.componentInstance.filtros.controls.nombre.value).toBe('');
  });

  // Valida la paginación: pulsar "siguiente" en el paginador pide la página 1.
  it('cargar_conVariasPaginas_usaElPaginador', () => {
    servicio.listar.and.returnValue(of(pagina([procesoBase], 0, 3)));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#btnPaginaSiguiente')?.click();
    expect(servicio.listar).toHaveBeenCalledWith(jasmine.objectContaining({ pagina: 1 }));
  });

  // Valida el manejo de un fallo de red (status 0): la alerta muestra "No se pudo conectar". Se llama detectChanges dos veces para que la plantilla pinte el cambio de signals.
  it('cargar_error_muestraElMensaje', () => {
    servicio.listar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#alertaErrorProcesos')?.textContent).toContain('No se pudo conectar');
  });

  // Valida la estrategia pesimista: tras confirmar y responder el backend OK, se recarga la lista (ya vacía) y se cierra la confirmación.
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

  // Valida que al eliminar el único elemento de la página 2 se recarga la página 1, no una vacía.
  it('eliminar_ultimaFilaDePaginaPosterior_vuelveALaPaginaAnterior', () => {
    servicio.listar.and.returnValue(of(pagina([procesoBase], 2, 3)));
    servicio.eliminar.and.returnValue(of(undefined));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    fixture.componentInstance.pedirEliminar(procesoBase);
    fixture.componentInstance.confirmarEliminar();
    expect(servicio.listar).toHaveBeenCalledWith(jasmine.objectContaining({ pagina: 1 }));
  });

  // Valida un 403: si el backend rechaza la eliminación, la fila sigue en la lista (nada cambia sin confirmación).
  it('eliminar_error_noQuitaLaFila', () => {
    servicio.listar.and.returnValue(of(pagina([procesoBase])));
    servicio.eliminar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403, error: { detail: 'Solo administrador' } })));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    fixture.componentInstance.pedirEliminar(procesoBase);
    fixture.componentInstance.confirmarEliminar();
    expect(fixture.componentInstance.pagina()?.content.length).toBe(1);
  });

  // Valida que cancelar, o confirmar sin proceso elegido, no llama al backend.
  it('cancelarEliminar_yConfirmarSinSeleccion_noHacenNada', () => {
    servicio.listar.and.returnValue(of(pagina([procesoBase])));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    fixture.componentInstance.pedirEliminar(procesoBase);
    fixture.componentInstance.cancelarEliminar();
    fixture.componentInstance.confirmarEliminar();
    expect(servicio.eliminar).not.toHaveBeenCalled();
  });

  // Valida roles de acceso: con rol SOLO_LECTURA no aparece el botón "Nuevo proceso".
  it('soloLectura_noVeElBotonNuevoProceso', () => {
    localStorage.clear();
    iniciarSesion('SOLO_LECTURA');
    servicio.listar.and.returnValue(of(pagina([])));
    const fixture = TestBed.createComponent(ProcesosComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#btnNuevoProceso')).toBeNull();
  });
});

// Pruebas de crear/editar proceso (HU-04, HU-05). La ruta se simula con ActivatedRoute: sin :id = crear; con :id = editar.
describe('ProcesoEdicionComponent', () => {
  let servicio: jasmine.SpyObj<ProcesoService>;
  let router: Router;

  // Ayudante: arma el entorno de prueba (espía del servicio, ruta con o sin id) y espía router.navigate para comprobar la navegación sin navegar realmente.
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

  // Valida que tras crear se navega a /procesos/:id usando el id devuelto por el backend (55), no uno inventado.
  it('crear_usaElIdReal_ynavegaAlDetalle', () => {
    configurar();
    servicio.crear.and.returnValue(of({ ...procesoBase, id: 55 }));
    const fixture = TestBed.createComponent(ProcesoEdicionComponent);
    fixture.detectChanges();
    fixture.componentInstance.guardar({ nombre: 'n', descripcion: 'd', categoria: 'c' });
    expect(router.navigate).toHaveBeenCalledWith(['/procesos', 55]);
  });

  // Valida un 400 de validación: el error del campo "nombre" queda en errores() y se apaga el estado de envío.
  it('crear_error400_muestraErroresPorCampo', () => {
    configurar();
    servicio.crear.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'nombre: El nombre es obligatorio.' } })));
    const fixture = TestBed.createComponent(ProcesoEdicionComponent);
    fixture.detectChanges();
    fixture.componentInstance.guardar({ nombre: '', descripcion: 'd', categoria: 'c' });
    expect(fixture.componentInstance.errores()['nombre']).toBe('El nombre es obligatorio.');
    expect(fixture.componentInstance.enviando()).toBeFalse();
  });

  // Valida el modo edición: se carga el proceso 7, se guarda con editar(7, datos) y se navega al detalle.
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

  // Valida un 404 al cargar: se muestra el detalle del error y se apaga el spinner.
  it('editar_procesoNoExiste_muestraElError404', () => {
    configurar('99');
    servicio.obtener.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'Proceso no encontrado.' } })));
    const fixture = TestBed.createComponent(ProcesoEdicionComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBe('Proceso no encontrado.');
    expect(fixture.componentInstance.cargando()).toBeFalse();
  });

  // Valida que en modo creación, cancelar navega a la lista de procesos.
  it('cancelar_vuelveAlListadoOAlDetalle', () => {
    configurar();
    const nuevo = TestBed.createComponent(ProcesoEdicionComponent);
    nuevo.componentInstance.cancelar();
    expect(router.navigate).toHaveBeenCalledWith(['/procesos']);
  });

  // Valida que un cambio de estado confirmado actualiza el proceso mostrado.
  it('alCambiarEstado_actualizaElProceso', () => {
    configurar('7');
    servicio.obtener.and.returnValue(of({ proceso: procesoBase, historial: [] }));
    const fixture = TestBed.createComponent(ProcesoEdicionComponent);
    fixture.detectChanges();
    fixture.componentInstance.alCambiarEstado({ ...procesoBase, estado: 'PUBLICADO' });
    expect(fixture.componentInstance.proceso()?.estado).toBe('PUBLICADO');
  });
});

// Pruebas del detalle del proceso (HU-07). La ruta simula /procesos/7.
describe('ProcesoDetalleComponent', () => {
  let servicio: jasmine.SpyObj<ProcesoService>;

  // Antes de cada prueba: sesión de ADMINISTRADOR, espía de ProcesoService y ruta con id 7.
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

  // Valida el switchMap: se obtiene el detalle y, encadenado, el diagrama del mismo id (7); se pintan título, historial y resumen del diagrama.
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

  // Valida que un 404 en la primera petición muestra la alerta con el detail del backend.
  it('inicio_error404_muestraElMensaje', () => {
    servicio.obtener.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'Proceso no encontrado.' } })));
    const fixture = TestBed.createComponent(ProcesoDetalleComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#alertaErrorDetalle')?.textContent).toContain('Proceso no encontrado.');
  });

  // Valida que tras cambiar el estado se actualiza el proceso y se vuelve a pedir el historial (que ahora tiene la entrada nueva).
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

  // Valida que si falla solo la recarga del historial (500) no se rompe nada: el historial queda como estaba.
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

// Pruebas de procesos compartidos con mi empresa (HU-23), siempre en solo lectura.
describe('CompartidosComponent y CompartidoDetalleComponent', () => {
  // Registro de ejemplo de un proceso compartido por otra empresa.
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

  // Antes de cada prueba: espía del servicio de compartidos y ruta con id 9.
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

  // Valida que la fila del proceso compartido muestra la insignia "Solo lectura".
  it('listado_muestraLosProcesosRecibidosEnSoloLectura', () => {
    servicio.listarRecibidos.and.returnValue(of([compartido]));
    const fixture = TestBed.createComponent(CompartidosComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#filaCompartido3')?.textContent).toContain('Solo lectura');
  });

  // Valida el estado vacío cuando ninguna empresa ha compartido procesos.
  it('listado_vacio_muestraEstadoVacio', () => {
    servicio.listarRecibidos.and.returnValue(of([]));
    const fixture = TestBed.createComponent(CompartidosComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ninguna empresa');
  });

  // Valida el fallo de red (status 0): el error() contiene "No se pudo conectar".
  it('listado_error_muestraElMensaje', () => {
    servicio.listarRecibidos.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const fixture = TestBed.createComponent(CompartidosComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toContain('No se pudo conectar');
  });

  // Valida que el detalle compartido pinta la insignia de solo lectura.
  it('detalle_muestraLaInsigniaDeSoloLectura', () => {
    const detalle: ProcesoCompartidoDetalleResponse = { ...diagramaVacio, empresaPropietaria: 'Otra S.A.', soloLectura: true };
    servicio.detalle.and.returnValue(of(detalle));
    const fixture = TestBed.createComponent(CompartidoDetalleComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#badgeSoloLectura')).not.toBeNull();
  });

  // Valida que un 404 (proceso compartido inexistente o sin acceso) muestra el mensaje del backend.
  it('detalle_error404_muestraElMensaje', () => {
    servicio.detalle.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'Proceso compartido no encontrado.' } })));
    const fixture = TestBed.createComponent(CompartidoDetalleComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#alertaErrorCompartido')?.textContent).toContain('no encontrado');
  });
});
