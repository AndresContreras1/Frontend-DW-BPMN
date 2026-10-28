import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { probarPeticion } from '../testing/http.util';
import { ActividadService } from './actividad.service';
import { ArcoService } from './arco.service';
import { EmpresaService } from './empresa.service';
import { EventoMensajeService } from './evento-mensaje.service';
import { GatewayService } from './gateway.service';
import { LaneService } from './lane.service';
import { MensajeService } from './mensaje.service';
import { PermisoEstructuraService } from './permiso-estructura.service';
import { PoolService } from './pool.service';
import { ProcesoCompartidoService } from './proceso-compartido.service';
import { ProcesoService } from './proceso.service';
import { RolProcesoService } from './rol-proceso.service';
import { UsuarioService } from './usuario.service';

const api = environment.apiUrl;

describe('Servicios de la API', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('EmpresaService_registrar_hacePostAEmpresas', () => {
    const datos = { nombreEmpresa: 'E', nit: '1', correoContacto: 'e@e.com', nombreAdmin: 'A', emailAdmin: 'a@e.com', passwordAdmin: '123456' };
    const { peticion } = probarPeticion(http, TestBed.inject(EmpresaService).registrar(datos), 'POST', api + '/empresas', { id: 1 });
    expect(peticion.request.body).toEqual(datos);
  });

  it('UsuarioService_operaciones_usanLosEndpointsDelBackend', () => {
    const s = TestBed.inject(UsuarioService);
    probarPeticion(http, s.listar(), 'GET', api + '/usuarios', []);
    probarPeticion(http, s.listar(false), 'GET', api + '/usuarios?activo=false', []);
    probarPeticion(http, s.obtener(3), 'GET', api + '/usuarios/3', {});
    probarPeticion(http, s.crear({ nombre: 'n', email: 'e', password: 'p', rolAcceso: 'EDITOR' }), 'POST', api + '/usuarios', {});
    probarPeticion(http, s.actualizar(3, { activo: false }), 'PATCH', api + '/usuarios/3', {});
    probarPeticion(http, s.desactivar(3), 'DELETE', api + '/usuarios/3', null);
    probarPeticion(http, s.invitar({ rolAcceso: 'EDITOR' }), 'POST', api + '/usuarios/invitaciones', {});
    probarPeticion(http, s.aceptarInvitacion('tok', { nombre: 'n', password: 'p' }), 'POST', api + '/usuarios/invitaciones/tok/aceptar', {});
  });

  it('PermisoEstructuraService_operaciones_usanLosEndpointsDelBackend', () => {
    const s = TestBed.inject(PermisoEstructuraService);
    probarPeticion(http, s.listar(), 'GET', api + '/permisos-estructura', []);
    probarPeticion(http, s.mio(), 'GET', api + '/permisos-estructura/mio', {});
    probarPeticion(http, s.actualizar('EDITOR', { crearPool: true, editarPool: true, eliminarPool: false, crearLane: true, editarLane: true, eliminarLane: false }), 'PUT', api + '/permisos-estructura/EDITOR', {});
  });

  it('ProcesoService_listar_enviaSoloLosFiltrosConValor', () => {
    const s = TestBed.inject(ProcesoService);
    const { peticion } = probarPeticion(
      http,
      s.listar({ nombre: 'vac', estado: 'BORRADOR', categoria: 'RRHH', activo: false, pagina: 2 }),
      'GET',
      api + '/procesos?nombre=vac&estado=BORRADOR&categoria=RRHH&activo=false&pagina=2',
      { content: [], page: 2, size: 10, totalElements: 0, totalPages: 0 }
    );
    expect(peticion.request.params.get('activo')).toBe('false');
  });

  it('ProcesoService_listarSinFiltros_pideLaPaginaCero', () => {
    probarPeticion(http, TestBed.inject(ProcesoService).listar(), 'GET', api + '/procesos?pagina=0', {});
  });

  it('ProcesoService_operaciones_usanLosEndpointsDelBackend', () => {
    const s = TestBed.inject(ProcesoService);
    const datos = { nombre: 'n', descripcion: 'd', categoria: 'c' };
    probarPeticion(http, s.obtener(1), 'GET', api + '/procesos/1', {});
    probarPeticion(http, s.crear(datos), 'POST', api + '/procesos', {});
    probarPeticion(http, s.editar(1, datos), 'PUT', api + '/procesos/1', {});
    const { peticion } = probarPeticion(http, s.cambiarEstado(1, 'PUBLICADO'), 'PATCH', api + '/procesos/1', {});
    expect(peticion.request.body).toEqual({ estado: 'PUBLICADO' });
    probarPeticion(http, s.eliminar(1), 'DELETE', api + '/procesos/1', null);
    probarPeticion(http, s.diagrama(1), 'GET', api + '/procesos/1/diagrama', {});
    probarPeticion(http, s.historial(1), 'GET', api + '/procesos/1/historial', []);
    probarPeticion(http, s.validacion(1), 'GET', api + '/procesos/1/validacion', { valido: true, advertencias: [] });
  });

  it('ProcesoCompartidoService_operaciones_usanLosEndpointsDelBackend', () => {
    const s = TestBed.inject(ProcesoCompartidoService);
    probarPeticion(http, s.listarDeProceso(1), 'GET', api + '/procesos/1/compartidos', []);
    probarPeticion(http, s.compartir(1, { empresaInvitadaId: 2 }), 'POST', api + '/procesos/1/compartidos', {});
    probarPeticion(http, s.dejarDeCompartir(1, 2), 'DELETE', api + '/procesos/1/compartidos/2', null);
    probarPeticion(http, s.listarRecibidos(), 'GET', api + '/procesos-compartidos', []);
    probarPeticion(http, s.detalle(1), 'GET', api + '/procesos-compartidos/1', {});
  });

  it('RolProcesoService_operaciones_usanLosEndpointsDelBackend', () => {
    const s = TestBed.inject(RolProcesoService);
    probarPeticion(http, s.listar(), 'GET', api + '/roles', []);
    probarPeticion(http, s.buscar('', 0), 'GET', api + '/roles/consulta?pagina=0', {});
    probarPeticion(http, s.buscar('ger', 1), 'GET', api + '/roles/consulta?pagina=1&nombre=ger', {});
    probarPeticion(http, s.obtener(1), 'GET', api + '/roles/1', {});
    probarPeticion(http, s.crear({ nombre: 'n' }), 'POST', api + '/roles', {});
    probarPeticion(http, s.editar(1, { nombre: 'n' }), 'PUT', api + '/roles/1', {});
    probarPeticion(http, s.eliminar(1), 'DELETE', api + '/roles/1', null);
  });

  it('PoolService_operaciones_usanLosEndpointsDelBackend', () => {
    const s = TestBed.inject(PoolService);
    probarPeticion(http, s.listar(1), 'GET', api + '/procesos/1/pools', []);
    probarPeticion(http, s.crear(1, { nombre: 'p', tipoParticipante: 'EMPRESA', cajaNegra: false }), 'POST', api + '/procesos/1/pools', {});
    probarPeticion(http, s.editar(5, { nombre: 'p', tipoParticipante: 'CLIENTE' }), 'PUT', api + '/pools/5', {});
    probarPeticion(http, s.eliminar(5), 'DELETE', api + '/pools/5', null);
  });

  it('LaneService_operaciones_usanLosEndpointsDelBackend', () => {
    const s = TestBed.inject(LaneService);
    probarPeticion(http, s.listar(5), 'GET', api + '/pools/5/lanes', []);
    probarPeticion(http, s.crear(5, { nombre: 'l', rolProcesoId: 1 }), 'POST', api + '/pools/5/lanes', {});
    probarPeticion(http, s.editar(7, { nombre: 'l', rolProcesoId: 1 }), 'PUT', api + '/lanes/7', {});
    probarPeticion(http, s.reordenar(5, { laneIds: [2, 1] }), 'PATCH', api + '/pools/5/lanes/orden', []);
    probarPeticion(http, s.eliminar(7), 'DELETE', api + '/lanes/7', null);
  });

  it('ActividadService_operaciones_usanLosEndpointsDelBackend', () => {
    const s = TestBed.inject(ActividadService);
    const datos = { nombre: 'a', posicionX: 1, posicionY: 2 };
    probarPeticion(http, s.listar(7), 'GET', api + '/lanes/7/actividades', []);
    probarPeticion(http, s.crear(7, datos), 'POST', api + '/lanes/7/actividades', {});
    probarPeticion(http, s.editar(9, datos), 'PUT', api + '/actividades/9', {});
    probarPeticion(http, s.impactoEliminacion(9), 'GET', api + '/actividades/9/impacto-eliminacion', {});
    probarPeticion(http, s.eliminar(9), 'DELETE', api + '/actividades/9', null);
  });

  it('GatewayService_operaciones_usanLosEndpointsDelBackend', () => {
    const s = TestBed.inject(GatewayService);
    const datos = { nombre: 'g', tipoGateway: 'EXCLUSIVO' as const, posicionX: 1, posicionY: 2 };
    probarPeticion(http, s.listar(7), 'GET', api + '/lanes/7/gateways', []);
    probarPeticion(http, s.crear(7, datos), 'POST', api + '/lanes/7/gateways', {});
    probarPeticion(http, s.editar(4, datos), 'PUT', api + '/gateways/4', {});
    probarPeticion(http, s.impactoEliminacion(4), 'GET', api + '/gateways/4/impacto-eliminacion', {});
    probarPeticion(http, s.eliminar(4), 'DELETE', api + '/gateways/4', null);
  });

  it('EventoMensajeService_operaciones_usanLosEndpointsDelBackend', () => {
    const s = TestBed.inject(EventoMensajeService);
    const datos = { nombre: 'e', tipoEvento: 'THROW' as const, contenido: 'c', claveCorrelacion: 'k', posicionX: 1, posicionY: 2, origenExterno: false };
    probarPeticion(http, s.listar(7), 'GET', api + '/lanes/7/eventos-mensaje', []);
    probarPeticion(http, s.crear(7, datos), 'POST', api + '/lanes/7/eventos-mensaje', {});
    probarPeticion(http, s.editar(3, datos), 'PUT', api + '/eventos-mensaje/3', {});
    probarPeticion(http, s.eliminar(3), 'DELETE', api + '/eventos-mensaje/3', null);
  });

  it('ArcoService_operaciones_usanLosEndpointsDelBackend', () => {
    const s = TestBed.inject(ArcoService);
    probarPeticion(http, s.listar(5), 'GET', api + '/pools/5/arcos', []);
    probarPeticion(http, s.crear({ origenId: 1, destinoId: 2 }), 'POST', api + '/arcos', {});
    probarPeticion(http, s.editar(8, { etiqueta: 'x' }), 'PUT', api + '/arcos/8', {});
    probarPeticion(http, s.impactoEliminacion(8), 'GET', api + '/arcos/8/impacto-eliminacion', {});
    probarPeticion(http, s.eliminar(8), 'DELETE', api + '/arcos/8', null);
  });

  it('MensajeService_operaciones_usanLosEndpointsDelBackend', () => {
    const s = TestBed.inject(MensajeService);
    probarPeticion(http, s.listar(1), 'GET', api + '/procesos/1/mensajes', []);
    probarPeticion(http, s.crear(1, { nombre: 'm', contenido: 'c', poolOrigenId: 1, poolDestinoId: 2 }), 'POST', api + '/procesos/1/mensajes', {});
    probarPeticion(http, s.editar(6, { nombre: 'm', contenido: 'c' }), 'PUT', api + '/mensajes/6', {});
    probarPeticion(http, s.eliminar(6), 'DELETE', api + '/mensajes/6', null);
    probarPeticion(http, s.obtenerCorrelacion(6), 'GET', api + '/mensajes/6/correlacion', {});
    probarPeticion(http, s.definirCorrelacion(6, { criterio: 'idPedido' }), 'PUT', api + '/mensajes/6/correlacion', {});
    probarPeticion(http, s.eliminarCorrelacion(6), 'DELETE', api + '/mensajes/6/correlacion', null);
  });
});
