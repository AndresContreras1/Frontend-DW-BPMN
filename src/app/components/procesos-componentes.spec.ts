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

describe('TablaProcesosComponent', () => {
  function crear(puedeEditar: boolean, puedeEliminar: boolean, procesos: ProcesoResponse[] = [procesoBase]) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(TablaProcesosComponent);
    fixture.componentRef.setInput('procesos', procesos);
    fixture.componentRef.setInput('puedeEditar', puedeEditar);
    fixture.componentRef.setInput('puedeEliminar', puedeEliminar);
    fixture.detectChanges();
    return fixture;
  }

  it('soloLectura_noMuestraEditarNiEliminar', () => {
    const el: HTMLElement = crear(false, false).nativeElement;
    expect(el.querySelector('#btnVer7')).not.toBeNull();
    expect(el.querySelector('#btnEditar7')).toBeNull();
    expect(el.querySelector('#btnEliminar7')).toBeNull();
  });

  it('administrador_veEditarYEliminarYEmiteElProceso', () => {
    const fixture = crear(true, true);
    let emitido: ProcesoResponse | undefined;
    fixture.componentInstance.eliminar.subscribe((p) => (emitido = p));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#btnEliminar7')?.click();
    expect(emitido?.id).toBe(7);
    expect((fixture.nativeElement as HTMLElement).querySelector('#btnEditar7')).not.toBeNull();
  });

  it('procesoEliminado_muestraEtiquetaYNoOfreceAcciones', () => {
    const el: HTMLElement = crear(true, true, [{ ...procesoBase, activo: false, estado: 'PUBLICADO' }]).nativeElement;
    expect(el.textContent).toContain('Eliminado');
    expect(el.textContent).toContain('Publicado');
    expect(el.querySelector('#btnEliminar7')).toBeNull();
  });
});

describe('ProcesoFormComponent', () => {
  it('crear_formularioInvalido_noEmite', () => {
    const fixture = TestBed.createComponent(ProcesoFormComponent);
    fixture.detectChanges();
    let emitido = false;
    fixture.componentInstance.guardar.subscribe(() => (emitido = true));
    fixture.componentInstance.enviar();
    expect(emitido).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#btnGuardarProceso')?.disabled).toBeTrue();
  });

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

  it('editar_cargaLosDatosDelProcesoEnElFormulario', () => {
    const fixture = TestBed.createComponent(ProcesoFormComponent);
    fixture.componentRef.setInput('proceso', procesoBase);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.getRawValue().nombre).toBe('Vacaciones');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Guardar cambios');
  });

  it('cancelar_emiteElEvento', () => {
    const fixture = TestBed.createComponent(ProcesoFormComponent);
    fixture.detectChanges();
    let cancelado = false;
    fixture.componentInstance.cancelar.subscribe(() => (cancelado = true));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#btnCancelarProceso')?.click();
    expect(cancelado).toBeTrue();
  });
});

describe('EstadoProcesoComponent', () => {
  let procesos: jasmine.SpyObj<ProcesoService>;

  function crear(proceso: ProcesoResponse, puedeEditar = true) {
    procesos = jasmine.createSpyObj<ProcesoService>('ProcesoService', ['cambiarEstado']);
    TestBed.configureTestingModule({ providers: [{ provide: ProcesoService, useValue: procesos }] });
    const fixture = TestBed.createComponent(EstadoProcesoComponent);
    fixture.componentRef.setInput('proceso', proceso);
    fixture.componentRef.setInput('puedeEditar', puedeEditar);
    fixture.detectChanges();
    return fixture;
  }

  it('borradorConPermiso_ofreceElBotonPublicar', () => {
    const el: HTMLElement = crear(procesoBase).nativeElement;
    expect(el.querySelector('#btnPublicar')).not.toBeNull();
    expect(el.querySelector('#txtEstadoProceso')?.textContent).toContain('Borrador');
  });

  it('soloLecturaOPublicado_noOfreceElBoton', () => {
    expect((crear(procesoBase, false).nativeElement as HTMLElement).querySelector('#btnPublicar')).toBeNull();
  });

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

  it('cancelar_cierraElModal', () => {
    const fixture = crear(procesoBase);
    fixture.componentInstance.pedirPublicar();
    fixture.componentInstance.cancelar();
    expect(fixture.componentInstance.confirmando()).toBeFalse();
  });
});

describe('CompartirProcesoComponent', () => {
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
  let servicio: jasmine.SpyObj<ProcesoCompartidoService>;

  function crear() {
    servicio = jasmine.createSpyObj<ProcesoCompartidoService>('ProcesoCompartidoService', ['listarDeProceso', 'compartir', 'dejarDeCompartir']);
    servicio.listarDeProceso.and.returnValue(of([]));
    TestBed.configureTestingModule({ providers: [{ provide: ProcesoCompartidoService, useValue: servicio }] });
    const fixture = TestBed.createComponent(CompartirProcesoComponent);
    fixture.componentRef.setInput('procesoId', 7);
    fixture.detectChanges();
    return fixture;
  }

  it('compartir_agregaLaFilaConLaRespuestaDelBackend', () => {
    const fixture = crear();
    servicio.compartir.and.returnValue(of(compartido));
    fixture.componentInstance.empresaId.setValue('2');
    fixture.componentInstance.compartir();
    expect(servicio.compartir).toHaveBeenCalledWith(7, { empresaInvitadaId: 2 });
    expect(fixture.componentInstance.compartidos()).toEqual([compartido]);
  });

  it('compartir_idInvalido_noLlamaAlBackend', () => {
    const fixture = crear();
    fixture.componentInstance.empresaId.setValue('abc');
    fixture.componentInstance.compartir();
    expect(servicio.compartir).not.toHaveBeenCalled();
  });

  it('compartir_error_muestraElDetalle', () => {
    const fixture = crear();
    servicio.compartir.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404, error: { detail: 'Empresa no encontrada.' } })));
    fixture.componentInstance.empresaId.setValue('99');
    fixture.componentInstance.compartir();
    expect(fixture.componentInstance.error()).toBe('Empresa no encontrada.');
  });

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

describe('ResumenDiagramaComponent', () => {
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
