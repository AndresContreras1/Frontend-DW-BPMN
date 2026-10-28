import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../service/auth.service';
import { NotificacionService } from '../service/notificacion.service';
import { TokenService } from '../service/token.service';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';

describe('Interceptores HTTP', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('authInterceptor_urlDelBackendConToken_agregaBearer', () => {
    TestBed.inject(TokenService).guardarSesion('tok', { id: 1, nombre: 'A', email: 'a', rolAcceso: 'EDITOR', activo: true });
    http.get(environment.apiUrl + '/procesos').subscribe();
    const req = controller.expectOne(environment.apiUrl + '/procesos');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok');
    req.flush({});
  });

  it('authInterceptor_urlAjena_noAgregaElToken', () => {
    TestBed.inject(TokenService).guardarSesion('tok', { id: 1, nombre: 'A', email: 'a', rolAcceso: 'EDITOR', activo: true });
    http.get('https://otro-sitio.com/datos').subscribe();
    const req = controller.expectOne('https://otro-sitio.com/datos');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('authInterceptor_sinToken_noAgregaCabecera', () => {
    http.get(environment.apiUrl + '/procesos').subscribe();
    const req = controller.expectOne(environment.apiUrl + '/procesos');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('errorInterceptor_401_limpiaSesionYVaAlLogin', () => {
    const auth = TestBed.inject(AuthService);
    spyOn(auth, 'limpiarSesion').and.callThrough();
    http.get(environment.apiUrl + '/procesos').subscribe({ error: () => undefined });
    controller.expectOne(environment.apiUrl + '/procesos').flush({ detail: 'x' }, { status: 401, statusText: 'No autenticado' });
    expect(auth.limpiarSesion).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('errorInterceptor_401EnLogin_noRedirige', () => {
    http.post(environment.apiUrl + '/auth/login', {}).subscribe({ error: () => undefined });
    controller.expectOne(environment.apiUrl + '/auth/login').flush({}, { status: 401, statusText: 'No autenticado' });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('errorInterceptor_403_avisaYRelanzaElError', () => {
    const notificaciones = TestBed.inject(NotificacionService);
    spyOn(notificaciones, 'error');
    let status = 0;
    http.get(environment.apiUrl + '/usuarios').subscribe({ error: (e) => (status = e.status) });
    controller.expectOne(environment.apiUrl + '/usuarios').flush({ detail: 'No tienes permisos para esta operación' }, { status: 403, statusText: 'Prohibido' });
    expect(notificaciones.error).toHaveBeenCalledWith('No tienes permisos para esta operación');
    expect(status).toBe(403);
  });
});
