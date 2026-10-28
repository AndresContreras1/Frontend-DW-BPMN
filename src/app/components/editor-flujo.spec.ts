import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ArcoResponse } from '../models/arco.model';
import { EventoMensajeResponse } from '../models/evento-mensaje.model';
import { CorrelacionResponse, MensajeResponse } from '../models/mensaje.model';
import { ArcoService } from '../service/arco.service';
import { EventoMensajeService } from '../service/evento-mensaje.service';
import { MensajeService } from '../service/mensaje.service';
import { NotificacionService } from '../service/notificacion.service';
import { diagramaEjemplo } from '../testing/datos';
import { calcularAdvertencias } from '../utils/advertencias-modelo';
import { listarNodos } from '../utils/nodos';
import { ArcoFormComponent } from './arco-form/arco-form.component';
import { CorrelacionFormComponent } from './correlacion-form/correlacion-form.component';
import { EventoFormComponent } from './evento-form/evento-form.component';
import { MensajeFormComponent } from './mensaje-form/mensaje-form.component';
import { PanelAdvertenciasComponent } from './panel-advertencias/panel-advertencias.component';

const datos = diagramaEjemplo;
const e409 = (detail: string) => new HttpErrorResponse({ status: 409, error: { detail } });

describe('listarNodos', () => {
  it('incluyeActividadesGatewaysYEventosConSuPool', () => {
    const nodos = listarNodos(datos);
    expect(nodos.length).toBe(4);
    expect(nodos.find((n) => n.id === 102)).toEqual(jasmine.objectContaining({ tipo: 'gateway', poolId: 1, etiqueta: 'Gateway: Aprobada' }));
  });

  it('laneSinPool_usaPoolCero', () => {
    const nodos = listarNodos({ ...datos, lanes: [] });
    expect(nodos[0].poolId).toBe(0);
  });
});

describe('calcularAdvertencias', () => {
  it('modeloDeEjemplo_avisaDelThrowSinMensajeAsociado', () => {
    const sinMensajes = calcularAdvertencias({ ...datos, mensajes: [] });
    expect(sinMensajes.some((a) => a.includes('NotificarPago') && a.includes('no tiene un mensaje asociado'))).toBeTrue();
  });

  it('gatewayDivergenteConUnaSalida_yArcosSinCondicion_seAvisan', () => {
    const avisos = calcularAdvertencias({ ...datos, arcos: [datos.arcos[0], datos.arcos[1], { ...datos.arcos[2], condicion: undefined }] });
    expect(avisos).toContain('El gateway "Aprobada" debe tener al menos dos salidas.');
    expect(avisos).toContain('Todos los arcos salientes del gateway "Aprobada" deben tener condición.');
  });

  it('gatewayParalelo_noExigeCondicion', () => {
    const avisos = calcularAdvertencias({
      ...datos,
      gateways: [{ ...datos.gateways[0], tipoGateway: 'PARALELO' }],
      arcos: [datos.arcos[1], { ...datos.arcos[2], condicion: undefined }, { ...datos.arcos[3], condicion: undefined }]
    });
    expect(avisos.some((a) => a.includes('deben tener condición'))).toBeFalse();
  });

  it('actividadSinArcos_seAvisa', () => {
    expect(calcularAdvertencias({ ...datos, arcos: [] }).some((a) => a.includes('no está conectada'))).toBeTrue();
  });

  it('catchDeInicioConArcoEntrante_yCatchSinMensaje_seAvisan', () => {
    const avisos = calcularAdvertencias({
      ...datos,
      eventos: [{ ...datos.eventos[0], id: 50, tipoEvento: 'CATCH_INICIO' }],
      arcos: [{ id: 1, origenId: 100, destinoId: 50, poolId: 1 }],
      mensajes: []
    });
    expect(avisos.some((a) => a.includes('no puede tener arcos entrantes'))).toBeTrue();
    expect(avisos.some((a) => a.includes('no recibe ningún mensaje'))).toBeTrue();
  });

  it('mensajeIncompleto_seAvisaEnCadaRegla', () => {
    const base = datos.mensajes[0];
    const avisos = calcularAdvertencias({
      ...datos,
      mensajes: [
        { ...base, id: 1, eventoThrowId: undefined, eventoCatchId: undefined, tipoDestinoExterno: undefined, claveCorrelacion: undefined },
        { ...base, id: 2, nombre: 'Repetido', claveCorrelacion: 'k', eventoCatchId: 103 },
        { ...base, id: 3, nombre: 'repetido', claveCorrelacion: 'K', eventoCatchId: 103 },
        { ...base, id: 4, nombre: 'Externo', poolDestinoId: 1, destinoExterno: '' }
      ]
    });
    expect(avisos.some((a) => a.includes('debe tener un Message Throw'))).toBeTrue();
    expect(avisos.some((a) => a.includes('Message Catch o un destino externo'))).toBeTrue();
    expect(avisos.some((a) => a.includes('no tiene clave de correlación'))).toBeTrue();
    expect(avisos.some((a) => a.includes('mensajes ambiguos'))).toBeTrue();
    expect(avisos.some((a) => a.includes('caja negra y documentar el destino'))).toBeTrue();
  });

  it('panel_muestraLasAdvertenciasOElMensajeDeSinAdvertencias', () => {
    const fixture = TestBed.createComponent(PanelAdvertenciasComponent);
    fixture.componentRef.setInput('datos', { ...datos, mensajes: [] });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('#listaAdvertenciasModelo li').length).toBeGreaterThan(0);
    const limpio = TestBed.createComponent(PanelAdvertenciasComponent);
    limpio.componentRef.setInput('datos', { pools: [], lanes: [], actividades: [], gateways: [], eventos: [], arcos: [], mensajes: [] });
    limpio.detectChanges();
    expect((limpio.nativeElement as HTMLElement).querySelector('#txtSinAdvertencias')).not.toBeNull();
  });
});

describe('EventoFormComponent', () => {
  let servicio: jasmine.SpyObj<EventoMensajeService>;
  const evento: EventoMensajeResponse = datos.eventos[0];

  beforeEach(() => {
    servicio = jasmine.createSpyObj<EventoMensajeService>('EventoMensajeService', ['crear', 'editar']);
    TestBed.configureTestingModule({ providers: [{ provide: EventoMensajeService, useValue: servicio }] });
  });

  function crear(actual: EventoMensajeResponse | null = null, laneInicial?: number) {
    const fixture = TestBed.createComponent(EventoFormComponent);
    fixture.componentRef.setInput('datos', datos);
    fixture.componentRef.setInput('evento', actual);
    fixture.componentRef.setInput('laneInicial', laneInicial);
    fixture.detectChanges();
    return fixture;
  }

  it('crear_enviaTipoClaveYPosicionSugerida', () => {
    servicio.crear.and.returnValue(of(evento));
    const fixture = crear(null, 10);
    fixture.componentInstance.form.patchValue({ nombre: 'Recibir', tipoEvento: 'CATCH_INICIO', contenido: 'dato', claveCorrelacion: 'k' });
    fixture.componentInstance.alCambiarLane();
    fixture.componentInstance.guardar();
    expect(servicio.crear).toHaveBeenCalledWith(10, jasmine.objectContaining({ tipoEvento: 'CATCH_INICIO', claveCorrelacion: 'k', posicionX: 240, origenExterno: false }));
  });

  it('editar_precargaYNoDejaCambiarLaLane', () => {
    servicio.editar.and.returnValue(of(evento));
    const fixture = crear(evento);
    expect(fixture.componentInstance.form.controls.laneId.disabled).toBeTrue();
    fixture.componentInstance.alCambiarLane();
    fixture.componentInstance.guardar();
    expect(servicio.editar).toHaveBeenCalledWith(103, jasmine.objectContaining({ nombre: 'NotificarPago' }));
  });

  it('sinClaveDeCorrelacion_noSeEnvia', () => {
    const fixture = crear(null, 10);
    fixture.componentInstance.form.patchValue({ nombre: 'X', contenido: 'c' });
    fixture.componentInstance.guardar();
    expect(servicio.crear).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.claveCorrelacion.invalid).toBeTrue();
  });

  it('errorDelBackend_seMuestra', () => {
    servicio.crear.and.returnValue(throwError(() => e409('Nombre duplicado.')));
    const fixture = crear(null, 10);
    fixture.componentInstance.form.patchValue({ nombre: 'X', contenido: 'c', claveCorrelacion: 'k' });
    fixture.componentInstance.guardar();
    expect(fixture.componentInstance.error()).toBe('Nombre duplicado.');
  });
});

describe('ArcoFormComponent', () => {
  let servicio: jasmine.SpyObj<ArcoService>;
  const arco: ArcoResponse = datos.arcos[2];

  beforeEach(() => {
    servicio = jasmine.createSpyObj<ArcoService>('ArcoService', ['crear', 'editar']);
    TestBed.configureTestingModule({ providers: [{ provide: ArcoService, useValue: servicio }] });
  });

  function crear(actual: ArcoResponse | null = null) {
    const fixture = TestBed.createComponent(ArcoFormComponent);
    fixture.componentRef.setInput('datos', datos);
    fixture.componentRef.setInput('arco', actual);
    fixture.detectChanges();
    return fixture;
  }

  it('destino_noOfreceElMismoNodoDelOrigenNiNodosDeOtroPool', () => {
    const fixture = crear();
    fixture.componentInstance.form.patchValue({ origenId: '100' });
    fixture.componentInstance.alCambiarOrigen();
    const destinos = fixture.componentInstance.opcionesDestino().map((o) => o.valor);
    expect(destinos).not.toContain('100');
    expect(destinos).toContain('101');
  });

  it('alCambiarElOrigen_quitaUnDestinoQueYaNoEsValido', () => {
    const fixture = crear();
    fixture.componentInstance.form.patchValue({ origenId: '100', destinoId: '101' });
    fixture.componentInstance.alCambiarOrigen();
    fixture.componentInstance.form.patchValue({ origenId: '101' });
    fixture.componentInstance.alCambiarOrigen();
    expect(fixture.componentInstance.form.controls.destinoId.value).toBe('');
    fixture.componentInstance.form.patchValue({ origenId: '' });
    fixture.componentInstance.alCambiarOrigen();
    expect(fixture.componentInstance.origenId()).toBeNull();
  });

  it('condicion_soloSePideCuandoSaleDeUnGatewayNoParalelo', () => {
    const fixture = crear();
    fixture.componentInstance.form.patchValue({ origenId: '100' });
    fixture.componentInstance.alCambiarOrigen();
    fixture.detectChanges();
    expect(fixture.componentInstance.pideCondicion()).toBeFalse();
    expect((fixture.nativeElement as HTMLElement).querySelector('#avisoSinCondicion')).not.toBeNull();
    fixture.componentInstance.form.patchValue({ origenId: '102' });
    fixture.componentInstance.alCambiarOrigen();
    fixture.detectChanges();
    expect(fixture.componentInstance.pideCondicion()).toBeTrue();
    expect((fixture.nativeElement as HTMLElement).querySelector('#txtCondicionArco')).not.toBeNull();
  });

  it('crear_conGatewayEnviaLaCondicion', () => {
    servicio.crear.and.returnValue(of(arco));
    const fixture = crear();
    fixture.componentInstance.form.patchValue({ origenId: '102' });
    fixture.componentInstance.alCambiarOrigen();
    fixture.componentInstance.form.patchValue({ destinoId: '103', etiqueta: 'Sí', condicion: ' x > 1 ' });
    fixture.componentInstance.guardar();
    expect(servicio.crear).toHaveBeenCalledWith({ origenId: 102, destinoId: 103, etiqueta: 'Sí', condicion: 'x > 1' });
  });

  it('crear_sinGateway_noEnviaCondicion', () => {
    servicio.crear.and.returnValue(of(arco));
    const fixture = crear();
    fixture.componentInstance.form.patchValue({ origenId: '100' });
    fixture.componentInstance.alCambiarOrigen();
    fixture.componentInstance.form.patchValue({ destinoId: '101', condicion: 'ignorada' });
    fixture.componentInstance.guardar();
    expect(servicio.crear).toHaveBeenCalledWith({ origenId: 100, destinoId: 101, etiqueta: undefined, condicion: undefined });
  });

  it('editar_precargaYUsaPut', () => {
    servicio.editar.and.returnValue(of(arco));
    const fixture = crear(arco);
    expect(fixture.componentInstance.pideCondicion()).toBeTrue();
    fixture.componentInstance.guardar();
    expect(servicio.editar).toHaveBeenCalledWith(202, jasmine.objectContaining({ origenId: 102, destinoId: 103 }));
  });

  it('formularioInvalidoYErrorDelBackend_duplicado', () => {
    servicio.crear.and.returnValue(throwError(() => e409('Ya existe un arco entre esos nodos.')));
    const fixture = crear();
    fixture.componentInstance.guardar();
    expect(servicio.crear).not.toHaveBeenCalled();
    fixture.componentInstance.form.patchValue({ origenId: '100', destinoId: '101' });
    fixture.componentInstance.guardar();
    expect(fixture.componentInstance.error()).toBe('Ya existe un arco entre esos nodos.');
  });
});

describe('MensajeFormComponent', () => {
  let servicio: jasmine.SpyObj<MensajeService>;
  const mensaje: MensajeResponse = datos.mensajes[0];

  beforeEach(() => {
    servicio = jasmine.createSpyObj<MensajeService>('MensajeService', ['crear', 'editar']);
    TestBed.configureTestingModule({ providers: [{ provide: MensajeService, useValue: servicio }] });
  });

  function crear(actual: MensajeResponse | null = null) {
    const fixture = TestBed.createComponent(MensajeFormComponent);
    fixture.componentRef.setInput('procesoId', 7);
    fixture.componentRef.setInput('datos', datos);
    fixture.componentRef.setInput('mensaje', actual);
    fixture.detectChanges();
    return fixture;
  }

  it('crear_proponeLosPoolsYElNombreDelEventoThrow', () => {
    const fixture = crear();
    const c = fixture.componentInstance;
    expect(c.form.controls.poolOrigenId.value).toBe('1');
    expect(c.form.controls.poolDestinoId.value).toBe('2');
    expect(c.opcionesThrow().map((o) => o.valor)).toContain('103');
    c.form.patchValue({ eventoThrowId: '103' });
    c.actualizarDependencias();
    expect(c.form.controls.nombre.value).toBe('NotificarPago');
  });

  it('crear_conDestinoExternoYActividadDeError_enviaTodoElContrato', () => {
    servicio.crear.and.returnValue(of(mensaje));
    const fixture = crear();
    const c = fixture.componentInstance;
    c.form.patchValue({
      nombre: 'Orden', contenido: 'datos', eventoThrowId: '103', claveCorrelacion: 'idSolicitud',
      tipoDestinoExterno: 'COLA', destinoExterno: 'cola-pagos', politicaFalloNotificacion: 'DERIVAR_ACTIVIDAD_ERROR',
      actividadErrorId: '100', politicaSinCaso: 'INICIAR_CASO_NUEVO'
    });
    c.form.controls.nombre.markAsDirty();
    c.actualizarDependencias();
    expect(c.conDestinoExterno()).toBeTrue();
    expect(c.derivaAError()).toBeTrue();
    c.guardar();
    expect(servicio.crear).toHaveBeenCalledWith(7, {
      nombre: 'Orden', contenido: 'datos', eventoCatchId: undefined, claveCorrelacion: 'idSolicitud', tipoDestinoExterno: 'COLA',
      destinoExterno: 'cola-pagos', politicaFalloNotificacion: 'DERIVAR_ACTIVIDAD_ERROR', actividadErrorId: 100,
      politicaSinCaso: 'INICIAR_CASO_NUEVO', poolOrigenId: 1, poolDestinoId: 2, eventoThrowId: 103
    });
  });

  it('actividadDeError_soloSeEnviaSiLaPoliticaEsDerivar', () => {
    servicio.crear.and.returnValue(of(mensaje));
    const fixture = crear();
    const c = fixture.componentInstance;
    c.form.patchValue({ nombre: 'M', contenido: 'c', eventoThrowId: '103', actividadErrorId: '100', politicaFalloNotificacion: 'CONTINUAR_FLUJO' });
    c.actualizarDependencias();
    c.guardar();
    expect(servicio.crear.calls.mostRecent().args[1].actividadErrorId).toBeUndefined();
  });

  it('cambiarElPoolDeOrigen_quitaUnEventoThrowQueYaNoPertenece', () => {
    const fixture = crear();
    const c = fixture.componentInstance;
    c.form.patchValue({ eventoThrowId: '103' });
    c.actualizarDependencias();
    c.form.patchValue({ poolOrigenId: '2' });
    c.actualizarDependencias();
    expect(c.form.controls.eventoThrowId.value).toBe('');
    c.form.patchValue({ poolDestinoId: '1', eventoCatchId: '103' });
    c.actualizarDependencias();
    expect(c.form.controls.eventoCatchId.value).toBe('');
  });

  it('editar_precargaDeshabilitaPoolsYThrowYUsaPut', () => {
    servicio.editar.and.returnValue(of(mensaje));
    const fixture = crear(mensaje);
    const c = fixture.componentInstance;
    expect(c.form.controls.poolOrigenId.disabled).toBeTrue();
    expect(c.form.controls.eventoThrowId.disabled).toBeTrue();
    expect(c.form.controls.tipoDestinoExterno.value).toBe('SERVICIO_WEB');
    c.guardar();
    expect(servicio.editar).toHaveBeenCalledWith(300, jasmine.objectContaining({ nombre: 'Orden de pago', tipoDestinoExterno: 'SERVICIO_WEB' }));
  });

  it('formularioInvalidoYError422_seMuestra', () => {
    servicio.crear.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'El nombre del evento de mensaje debe coincidir con el mensaje.' } })));
    const fixture = crear();
    fixture.componentInstance.guardar();
    expect(servicio.crear).not.toHaveBeenCalled();
    fixture.componentInstance.form.patchValue({ nombre: 'Otro', contenido: 'c' });
    fixture.componentInstance.guardar();
    expect(fixture.componentInstance.error()).toContain('debe coincidir');
  });
});

describe('CorrelacionFormComponent', () => {
  let servicio: jasmine.SpyObj<MensajeService>;
  const correlacion: CorrelacionResponse = { id: 1, criterio: 'idSolicitud', mensajeId: 300 };

  beforeEach(() => {
    servicio = jasmine.createSpyObj<MensajeService>('MensajeService', ['obtenerCorrelacion', 'definirCorrelacion', 'eliminarCorrelacion']);
    TestBed.configureTestingModule({ providers: [{ provide: MensajeService, useValue: servicio }] });
  });

  function crear(puedeEditar = true) {
    const fixture = TestBed.createComponent(CorrelacionFormComponent);
    fixture.componentRef.setInput('mensajeId', 300);
    fixture.componentRef.setInput('puedeEditar', puedeEditar);
    fixture.detectChanges();
    return fixture;
  }

  it('conCorrelacion_muestraElCriterioActual', () => {
    servicio.obtenerCorrelacion.and.returnValue(of(correlacion));
    const fixture = crear();
    expect((fixture.nativeElement as HTMLElement).querySelector('#txtCriterioActual')?.textContent).toContain('idSolicitud');
    expect((fixture.nativeElement as HTMLElement).querySelector('#btnQuitarCorrelacion')).not.toBeNull();
  });

  it('sinCorrelacion404_avisaQueEsObligatoriaParaPublicar', () => {
    servicio.obtenerCorrelacion.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const fixture = crear();
    expect((fixture.nativeElement as HTMLElement).querySelector('#txtSinCorrelacion')?.textContent).toContain('obligatoria para publicar');
  });

  it('guardar_defineElCriterioConPut', () => {
    servicio.obtenerCorrelacion.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    servicio.definirCorrelacion.and.returnValue(of(correlacion));
    const fixture = crear();
    fixture.componentInstance.criterio.setValue(' idSolicitud ');
    fixture.componentInstance.guardar();
    expect(servicio.definirCorrelacion).toHaveBeenCalledWith(300, { criterio: 'idSolicitud' });
    expect(fixture.componentInstance.correlacion()).toEqual(correlacion);
  });

  it('guardar_sinCriterio_noLlamaAlBackend', () => {
    servicio.obtenerCorrelacion.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const fixture = crear();
    fixture.componentInstance.guardar();
    expect(servicio.definirCorrelacion).not.toHaveBeenCalled();
  });

  it('guardar_error_muestraElDetalle', () => {
    servicio.obtenerCorrelacion.and.returnValue(of(correlacion));
    servicio.definirCorrelacion.and.returnValue(throwError(() => e409('Criterio inválido.')));
    const fixture = crear();
    fixture.componentInstance.guardar();
    expect(fixture.componentInstance.error()).toBe('Criterio inválido.');
  });

  it('quitar_eliminaLaCorrelacionConfirmadaPorElBackend', () => {
    servicio.obtenerCorrelacion.and.returnValue(of(correlacion));
    servicio.eliminarCorrelacion.and.returnValue(of(undefined));
    const fixture = crear();
    spyOn(TestBed.inject(NotificacionService), 'exito');
    fixture.componentInstance.quitar();
    expect(fixture.componentInstance.correlacion()).toBeNull();
  });

  it('quitar_error_muestraElDetalle', () => {
    servicio.obtenerCorrelacion.and.returnValue(of(correlacion));
    servicio.eliminarCorrelacion.and.returnValue(throwError(() => e409('No se puede quitar.')));
    const fixture = crear();
    fixture.componentInstance.quitar();
    expect(fixture.componentInstance.error()).toBe('No se puede quitar.');
    expect(fixture.componentInstance.correlacion()).not.toBeNull();
  });

  it('soloLectura_noMuestraElFormulario', () => {
    servicio.obtenerCorrelacion.and.returnValue(of(correlacion));
    const fixture = crear(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('#btnGuardarCorrelacion')).toBeNull();
  });
});
