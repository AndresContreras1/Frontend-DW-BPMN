// Pruebas de los componentes de procesos: tabla, formularios, estado/publicación, compartir y resumen del diagrama.
// Se usan espías (jasmine.createSpyObj) para sustituir los servicios y no llamar al backend real.
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { procesoBase } from '../testing/datos';
import { ProcesoCompartidoResponse } from '../models/proceso-compartido.model';
import { ProcesoDiagramaResponse, ProcesoResponse } from '../models/proceso.model';
import { NotificacionService } from '../service/notificacion.service';
import { ProcesoCompartidoService } from '../service/proceso-compartido.service';
import { ProcesoService } from '../service/proceso.service';
import { CompartirProcesoComponent } from './compartir-proceso/compartir-proceso.component';
import { EstadoProcesoComponent } from './estado-proceso/estado-proceso.component';
import { ProcesoFormComponent } from './proceso-form/proceso-form.component';
import { ResumenDiagramaComponent } from './resumen-diagrama/resumen-diagrama.component';
import { TablaProcesosComponent } from './tabla-procesos/tabla-procesos.component';

// Tabla de procesos: qué acciones se ofrecen según los permisos.
describe('TablaProcesosComponent', () => {
  // Ayuda: crea la tabla con permisos y datos de prueba (procesoBase viene de testing/datos).
  function crear(puedeEditar: boolean, puedeEliminar: boolean, procesos: ProcesoResponse[] = [procesoBase]) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TablaProcesosComponent);
    fixture.componentRef.setInput('procesos', procesos);
    fixture.componentRef.setInput('puedeEditar', puedeEditar);
    fixture.componentRef.setInput('puedeEliminar', puedeEliminar);
    fixture.detectChanges();
    return fixture;
  }

  // Valida que sin permisos solo existe el botón Ver.
  it('soloLectura_noMuestraEditarNiEliminar', () => {
    const el: HTMLElement = crear(false, false).nativeElement;
    expect(el.querySelector('#btnVer7')).not.toBeNull();
    expect(el.querySelector('#btnEditar7')).toBeNull();
    expect(el.querySelector('#btnEliminar7')).toBeNull();
  });

  // Valida que con permisos aparecen Editar y Eliminar, y que Eliminar emite el proceso al padre.
  it('administrador_veEditarYEliminarYEmiteElProceso', () => {
    const fixture = crear(true, true);
    let emitido: ProcesoResponse | undefined;
    fixture.componentInstance.eliminar.subscribe((p) => (emitido = p));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#btnEliminar7')?.click();
    expect(emitido?.id).toBe(7);
    expect((fixture.nativeElement as HTMLElement).querySelector('#btnEditar7')).not.toBeNull();
  });

  // Valida que un proceso eliminado muestra su insignia y no ofrece acciones aunque haya permisos.
  it('procesoEliminado_muestraEtiquetaYNoOfreceAcciones', () => {
    const el: HTMLElement = crear(true, true, [{ ...procesoBase, activo: false, estado: 'PUBLICADO' }]).nativeElement;
    expect(el.textContent).toContain('Eliminado');
    expect(el.textContent).toContain('Publicado');
    expect(el.querySelector('#btnEliminar7')).toBeNull();
  });
});

// Formulario de proceso: validación, emisión y modos crear/editar.
describe('ProcesoFormComponent', () => {
  // Valida que un formulario vacío no emite y deja el botón guardar deshabilitado.
  it('crear_formularioInvalido_noEmite', () => {
    const fixture = TestBed.createComponent(ProcesoFormComponent);
    fixture.detectChanges();
    let emitido = false;
    fixture.componentInstance.guardar.subscribe(() => (emitido = true));
    fixture.componentInstance.enviar();
    expect(emitido).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#btnGuardarProceso')?.disabled).toBeTrue();
  });

  // Valida que con datos válidos se emite el request esperado y el botón dice Crear proceso.
  it('crear_datosValidos_emiteElRequest', () => {
    const fixture = TestBed.createComponent(ProcesoFormComponent);
    fixture.detectChanges();
    let emitido: unknown;
    fixture.componentInstance.guardar.subscribe((v) => (emitido = v));
    fixture.componentInstance.form.setValue({ nombre: 'Compras', descripcion: 'Compra de insumos', categoria: 'Compras' });
    fixture.componentInstance.enviar();
    expect(emitido).toEqual({ nombre: 'Compras', descripcion: 'Compra de insumos', categoria: 'Compras' });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Crear proceso');
  });

  // Valida que en modo edición el effect precarga el formulario y el botón dice Guardar cambios.
  it('editar_cargaLosDatosDelProcesoEnElFormulario', () => {
    const fixture = TestBed.createComponent(ProcesoFormComponent);
    fixture.componentRef.setInput('proceso', procesoBase);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.getRawValue().nombre).toBe('Vacaciones');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Guardar cambios');
  });

  // Valida que Cancelar emite el evento al padre.
  it('cancelar_emiteElEvento', () => {
    const fixture = TestBed.createComponent(ProcesoFormComponent);
    fixture.detectChanges();
    let cancelado = false;
    fixture.componentInstance.cancelar.subscribe(() => (cancelado = true));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#btnCancelarProceso')?.click();
    expect(cancelado).toBeTrue();
  });
});

// Estado y publicación del proceso.
describe('EstadoProcesoComponent', () => {
  // Espía del servicio: permite controlar qué responde cambiarEstado.
  let procesos: jasmine.SpyObj<ProcesoService>;

  // Ayuda: sustituye ProcesoService por el espía y crea el componente con sus inputs.
  function crear(proceso: ProcesoResponse, puedeEditar = true) {
    procesos = jasmine.createSpyObj<ProcesoService>('ProcesoService', ['cambiarEstado']);
    TestBed.configureTestingModule({ providers: [{ provide: ProcesoService, useValue: procesos }] });
    const fixture = TestBed.createComponent(EstadoProcesoComponent);
    fixture.componentRef.setInput('proceso', proceso);
    fixture.componentRef.setInput('puedeEditar', puedeEditar);
    fixture.detectChanges();
    return fixture;
  }

  // Valida que un borrador editable muestra el estado y el botón Publicar.
  it('borradorConPermiso_ofreceElBotonPublicar', () => {
    const el: HTMLElement = crear(procesoBase).nativeElement;
    expect(el.querySelector('#btnPublicar')).not.toBeNull();
    expect(el.querySelector('#txtEstadoProceso')?.textContent).toContain('Borrador');
  });

  // Valida que sin permiso de edición no se ofrece Publicar.
  it('soloLecturaOPublicado_noOfreceElBoton', () => {
    expect((crear(procesoBase, false).nativeElement as HTMLElement).querySelector('#btnPublicar')).toBeNull();
  });

  // Valida el flujo feliz: pide confirmación, llama al servicio con PUBLICADO, emite el proceso y cierra el modal.
  it('publicar_exito_emiteElProcesoPublicado', () => {
    const fixture = crear(procesoBase);
    const publicado = { ...procesoBase, estado: 'PUBLICADO' as const };
    procesos.cambiarEstado.and.returnValue(of(publicado));
    let emitido: ProcesoResponse | undefined;
    fixture.componentInstance.cambiado.subscribe((p) => (emitido = p));
    fixture.componentInstance.pedirPublicar();
    expect(fixture.componentInstance.confirmando()).toBeTrue();
    fixture.componentInstance.publicar();
    expect(procesos.cambiarEstado).toHaveBeenCalledWith(7, 'PUBLICADO');
    expect(emitido).toEqual(publicado);
    expect(fixture.componentInstance.confirmando()).toBeFalse();
  });

  // Valida que un 409 del backend se muestra como advertencia en pantalla.
  it('publicar_modeloIncoherente409_muestraLaAdvertenciaDelBackend', () => {
    const fixture = crear(procesoBase);
    procesos.cambiarEstado.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'El nodo X no tiene salida.' } }))
    );
    fixture.componentInstance.pedirPublicar();
    fixture.componentInstance.publicar();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#alertaPublicacion')?.textContent).toContain('El nodo X no tiene salida.');
  });

  // Valida que cancelar cierra el modal de confirmación.
  it('cancelar_cierraElModal', () => {
    const fixture = crear(procesoBase);
    fixture.componentInstance.pedirPublicar();
    fixture.componentInstance.cancelar();
    expect(fixture.componentInstance.confirmando()).toBeFalse();
  });
});

// Compartir proceso con otra empresa.
describe('CompartirProcesoComponent', () => {
  // Dato de prueba: una empresa invitada con solo lectura.
  const compartido: ProcesoCompartidoResponse = {
    id: 1,
    procesoId: 7,
    procesoNombre: 'Vacaciones',
    empresaPropietariaId: 1,
    empresaPropietaria: 'Demo',
    empresaInvitadaId: 2,
    empresaInvitada: 'Otra S.A.',
    soloLectura: true
  };
  // Espía del servicio de procesos compartidos.
  let servicio: jasmine.SpyObj<ProcesoCompartidoService>;

  // Ayuda: espía con lista inicial vacía y componente con procesoId = 7.
  function crear() {
    servicio = jasmine.createSpyObj<ProcesoCompartidoService>('ProcesoCompartidoService', ['listarDeProceso', 'compartir', 'dejarDeCompartir']);
    servicio.listarDeProceso.and.returnValue(of([]));
    TestBed.configureTestingModule({ providers: [{ provide: ProcesoCompartidoService, useValue: servicio }] });
    const fixture = TestBed.createComponent(CompartirProcesoComponent);
    fixture.componentRef.setInput('procesoId', 7);
    fixture.detectChanges();
    return fixture;
  }

  // Valida que compartir llama al servicio con el id numérico y agrega la fila devuelta.
  it('compartir_agregaLaFilaConLaRespuestaDelBackend', () => {
    const fixture = crear();
    servicio.compartir.and.returnValue(of(compartido));
    fixture.componentInstance.empresaId.setValue('2');
    fixture.componentInstance.compartir();
    expect(servicio.compartir).toHaveBeenCalledWith(7, { empresaInvitadaId: 2 });
    expect(fixture.componentInstance.compartidos()).toEqual([compartido]);
  });

  // Valida que un id no numérico no llega al backend.
  it('compartir_idInvalido_noLlamaAlBackend', () => {
    const fixture = crear();
    fixture.componentInstance.empresaId.setValue('abc');
    fixture.componentInstance.compartir();
    expect(servicio.compartir).not.toHaveBeenCalled();
  });

  // Valida que el detalle del error del backend queda en el signal de error.
  it('compartir_error_muestraElDetalle', () => {
    const fixture = crear();
    servicio.compartir.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'Empresa no encontrada.' } })));
    fixture.componentInstance.empresaId.setValue('99');
    fixture.componentInstance.compartir();
    expect(fixture.componentInstance.error()).toBe('Empresa no encontrada.');
  });

  // Valida que la fila se quita cuando el backend confirma.
  it('dejarDeCompartir_quitaLaFilaCuandoElBackendConfirma', () => {
    servicio = jasmine.createSpyObj<ProcesoCompartidoService>('ProcesoCompartidoService', ['listarDeProceso', 'compartir', 'dejarDeCompartir']);
    servicio.listarDeProceso.and.returnValue(of([compartido]));
    servicio.dejarDeCompartir.and.returnValue(of(undefined));
    TestBed.configureTestingModule({ providers: [{ provide: ProcesoCompartidoService, useValue: servicio }] });
    const fixture = TestBed.createComponent(CompartirProcesoComponent);
    fixture.componentRef.setInput('procesoId', 7);
    fixture.detectChanges();
    fixture.componentInstance.dejarDeCompartir(compartido);
    expect(servicio.dejarDeCompartir).toHaveBeenCalledWith(7, 2);
    expect(fixture.componentInstance.compartidos().length).toBe(0);
  });

  // Valida que si el backend rechaza (403) la fila se conserva y se muestra el error.
  it('dejarDeCompartir_error_mantieneLaFila', () => {
    servicio = jasmine.createSpyObj<ProcesoCompartidoService>('ProcesoCompartidoService', ['listarDeProceso', 'compartir', 'dejarDeCompartir']);
    servicio.listarDeProceso.and.returnValue(of([compartido]));
    servicio.dejarDeCompartir.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403, error: { detail: 'Solo el administrador.' } })));
    TestBed.configureTestingModule({ providers: [{ provide: ProcesoCompartidoService, useValue: servicio }] });
    const fixture = TestBed.createComponent(CompartirProcesoComponent);
    fixture.componentRef.setInput('procesoId', 7);
    fixture.detectChanges();
    fixture.componentInstance.dejarDeCompartir(compartido);
    expect(fixture.componentInstance.compartidos().length).toBe(1);
    expect(fixture.componentInstance.error()).toBe('Solo el administrador.');
  });

  // Valida que un fallo al listar al iniciar muestra un error.
  it('inicio_errorAlListar_muestraElError', () => {
    servicio = jasmine.createSpyObj<ProcesoCompartidoService>('ProcesoCompartidoService', ['listarDeProceso']);
    servicio.listarDeProceso.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    TestBed.configureTestingModule({ providers: [{ provide: ProcesoCompartidoService, useValue: servicio }] });
    const fixture = TestBed.createComponent(CompartirProcesoComponent);
    fixture.componentRef.setInput('procesoId', 7);
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).not.toBe('');
  });
});

// Resumen numérico del diagrama.
describe('ResumenDiagramaComponent', () => {
  // Valida que el computed cuenta cada tipo (1 pool) y que se dibujan las 7 insignias.
  it('cuentaCadaTipoDeElemento', () => {
    const diagrama: ProcesoDiagramaResponse = {
      proceso: procesoBase,
      pools: [{ id: 1, nombre: 'P', tipoParticipante: 'EMPRESA', cajaNegra: false, orden: 0, procesoId: 7 }],
      lanes: [],
      actividades: [],
      gateways: [],
      eventos: [],
      arcos: [],
      mensajes: []
    };
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), NotificacionService] });
    const fixture = TestBed.createComponent(ResumenDiagramaComponent);
    fixture.componentRef.setInput('diagrama', diagrama);
    fixture.detectChanges();
    expect(fixture.componentInstance.elementos()[0]).toEqual({ etiqueta: 'Pools', cantidad: 1 });
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('li').length).toBe(7);
  });
});
