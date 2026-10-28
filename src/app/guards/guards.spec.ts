import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RolAcceso } from '../models/enums.model';
import { TokenService } from '../service/token.service';
import { NotificacionService } from '../service/notificacion.service';
import { authGuard } from './auth.guard';
import { rolGuard } from './rol.guard';

function ruta(roles?: RolAcceso[]): ActivatedRouteSnapshot {
  return { data: roles ? { roles } : {} } as unknown as ActivatedRouteSnapshot;
}

const estado = {} as RouterStateSnapshot;

function iniciarSesion(rol: RolAcceso): void {
  TestBed.inject(TokenService).guardarSesion('t', { id: 1, nombre: 'A', email: 'a', rolAcceso: rol, activo: true });
}

describe('Guards', () => {
  function preparar(): Router {
    return TestBed.inject(Router);
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  });

  it('authGuard_sinSesion_redirigeAlLogin', () => {
    const router = preparar();
    const resultado = TestBed.runInInjectionContext(() => authGuard(ruta(), estado));
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/login');
  });

  it('authGuard_conSesion_permite', () => {
    iniciarSesion('EDITOR');
    preparar();
    expect(TestBed.runInInjectionContext(() => authGuard(ruta(), estado))).toBeTrue();
  });

  it('rolGuard_sinSesion_redirigeAlLogin', () => {
    const router = preparar();
    const resultado = TestBed.runInInjectionContext(() => rolGuard(ruta(['ADMINISTRADOR']), estado));
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/login');
  });

  it('rolGuard_rolPermitido_permite', () => {
    iniciarSesion('ADMINISTRADOR');
    preparar();
    expect(TestBed.runInInjectionContext(() => rolGuard(ruta(['ADMINISTRADOR']), estado))).toBeTrue();
  });

  it('rolGuard_rolNoPermitido_avisaYRedirigeAProcesos', () => {
    iniciarSesion('SOLO_LECTURA');
    const router = preparar();
    const notificaciones = TestBed.inject(NotificacionService);
    spyOn(notificaciones, 'error');
    const resultado = TestBed.runInInjectionContext(() => rolGuard(ruta(['ADMINISTRADOR']), estado));
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/procesos');
    expect(notificaciones.error).toHaveBeenCalled();
  });

  it('rolGuard_sinRolesEnLaRuta_niega', () => {
    iniciarSesion('ADMINISTRADOR');
    preparar();
    expect(TestBed.runInInjectionContext(() => rolGuard(ruta(), estado))).not.toBeTrue();
  });
});
