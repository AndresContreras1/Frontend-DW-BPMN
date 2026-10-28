import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { LoginResponse } from '../models/auth.model';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

const respuesta: LoginResponse = {
  accessToken: 'tok',
  tokenType: 'Bearer',
  expiresIn: 1800,
  usuario: { id: 1, nombre: 'Admin', email: 'a@demo.com', rolAcceso: 'ADMINISTRADOR', activo: true }
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

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

  it('logout_llamaAlBackend', () => {
    service.logout().subscribe();
    const req = http.expectOne(environment.apiUrl + '/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });

  it('limpiarSesion_borraUsuarioYToken', () => {
    service.login({ email: 'a', password: 'b' }).subscribe();
    http.expectOne(environment.apiUrl + '/auth/login').flush(respuesta);
    service.limpiarSesion();
    expect(service.autenticado()).toBeFalse();
    expect(service.puedeEditar()).toBeFalse();
    expect(TestBed.inject(TokenService).obtenerToken()).toBeNull();
  });

  it('tieneRol_sinUsuario_devuelveFalso', () => {
    expect(service.tieneRol('ADMINISTRADOR')).toBeFalse();
  });

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
