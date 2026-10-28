// =============================================================================
// auth.service.spec.ts
// Pruebas de AuthService sin backend real. Se usa HttpTestingController: un
// "backend falso" que intercepta las peticiones de HttpClient. Flujo típico:
//   1) el servicio hace una petición (subscribe la dispara);
//   2) http.expectOne(url) captura esa petición y permite revisar método, cuerpo...;
//   3) req.flush(datos) simula la respuesta del servidor;
//   4) http.verify() (en afterEach) falla si quedó alguna petición sin atender.
// provideHttpClient() + provideHttpClientTesting() reemplazan el transporte real
// por el de prueba.
// =============================================================================
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { LoginResponse } from '../models/auth.model';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

// Respuesta de login simulada que "devuelve" el backend falso en las pruebas.
const respuesta: LoginResponse = {
  accessToken: 'tok',
  tokenType: 'Bearer',
  expiresIn: 1800,
  usuario: { id: 1, nombre: 'Admin', email: 'a@demo.com', rolAcceso: 'ADMINISTRADOR', activo: true }
};

/** Pruebas del servicio de autenticación y de sus señales de estado. */
describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  // Cada prueba parte de localStorage vacío y de un módulo de pruebas nuevo,
  // para que el estado inicial (sin sesión) sea siempre el mismo.
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  // Garantiza que no se quede ninguna petición HTTP pendiente de responder.
  afterEach(() => http.verify());

  // Valida el login completo: usa POST /auth/login, guarda el token en
  // localStorage y actualiza las señales (usuario, autenticado, esAdministrador,
  // puedeEditar). Es la prueba central del flujo de inicio de sesión.
  it('login_guardaSesionYActualizaElUsuario', () => {
    service.login({ email: 'a@demo.com', password: 'x' }).subscribe();
    const req = http.expectOne(environment.apiUrl + '/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(respuesta);
    expect(TestBed.inject(TokenService).obtenerToken()).toBe('tok');
    expect(service.usuario()?.nombre).toBe('Admin');
    expect(service.autenticado()).toBeTrue();
    expect(service.esAdministrador()).toBeTrue();
    expect(service.puedeEditar()).toBeTrue();
  });

  // El logout debe avisar al backend con POST /auth/logout. flush(null) simula
  // una respuesta sin cuerpo (Observable<void>).
  it('logout_llamaAlBackend', () => {
    service.logout().subscribe();
    const req = http.expectOne(environment.apiUrl + '/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  // Tras iniciar sesión y llamar limpiarSesion(), el estado local debe quedar
  // como el de un visitante anónimo (sin permisos ni token guardado).
  it('limpiarSesion_borraUsuarioYToken', () => {
    service.login({ email: 'a', password: 'b' }).subscribe();
    http.expectOne(environment.apiUrl + '/auth/login').flush(respuesta);
    service.limpiarSesion();
    expect(service.autenticado()).toBeFalse();
    expect(service.puedeEditar()).toBeFalse();
    expect(TestBed.inject(TokenService).obtenerToken()).toBeNull();
  });

  // Sin sesión, tieneRol debe ser falso para cualquier rol: evita dar acceso a
  // quien no está autenticado.
  it('tieneRol_sinUsuario_devuelveFalso', () => {
    expect(service.tieneRol('ADMINISTRADOR')).toBeFalse();
  });

  // Control de acceso: un usuario con rol de solo lectura NO puede editar
  // diagramas, aunque tieneRol confirme que ese es su rol. El spread (...) crea
  // una respuesta modificada sin alterar la constante original.
  it('puedeEditar_soloLectura_devuelveFalso', () => {
    service.login({ email: 'a', password: 'b' }).subscribe();
    http.expectOne(environment.apiUrl + '/auth/login').flush({
      ...respuesta,
      usuario: { ...respuesta.usuario, rolAcceso: 'SOLO_LECTURA' }
    });
    expect(service.puedeEditar()).toBeFalse();
    expect(service.tieneRol('SOLO_LECTURA')).toBeTrue();
  });
});
