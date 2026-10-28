// Pruebas de authGuard y rolGuard. Se ejecutan con runInInjectionContext porque los guards
// funcionales usan inject() y necesitan un contexto de inyección.
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RolAcceso } from '../models/enums.model';
import { TokenService } from '../service/token.service';
import { NotificacionService } from '../service/notificacion.service';
import { authGuard } from './auth.guard';
import { rolGuard } from './rol.guard';

// Construye una ruta falsa solo con el "data.roles" que el guard necesita (cast mediante unknown, evitando any).
function ruta(roles?: RolAcceso[]): ActivatedRouteSnapshot {
  return { data: roles ? { roles } : {} } as unknown as ActivatedRouteSnapshot;
}

// El guard no usa el estado del router; basta un objeto vacío del tipo correcto.
const estado = {} as RouterStateSnapshot;

// Simula una sesión guardando token y usuario con el rol deseado.
function iniciarSesion(rol: RolAcceso): void {
  TestBed.inject(TokenService).guardarSesion('t', { id: 1, nombre: 'A', email: 'a', rolAcceso: rol, activo: true });
}

// Agrupa las pruebas de ambos guards.
describe('Guards', () => {
  function preparar(): Router {
    return TestBed.inject(Router);
  }

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  });

  // Sin sesión debe devolver un UrlTree hacia /login.
  it('authGuard_sinSesion_redirigeAlLogin', () => {
    const router = preparar();
    const resultado = TestBed.runInInjectionContext(() => authGuard(ruta(), estado));
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/login');
  });

  // Con sesión permite el paso (true).
  it('authGuard_conSesion_permite', () => {
    iniciarSesion('EDITOR');
    preparar();
    expect(TestBed.runInInjectionContext(() => authGuard(ruta(), estado))).toBeTrue();
  });

  // Sin sesión, rolGuard también manda al login antes de revisar roles.
  it('rolGuard_sinSesion_redirigeAlLogin', () => {
    const router = preparar();
    const resultado = TestBed.runInInjectionContext(() => rolGuard(ruta(['ADMINISTRADOR']), estado));
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/login');
  });

  // Un usuario cuyo rol figura en la ruta puede entrar.
  it('rolGuard_rolPermitido_permite', () => {
    iniciarSesion('ADMINISTRADOR');
    preparar();
    expect(TestBed.runInInjectionContext(() => rolGuard(ruta(['ADMINISTRADOR']), estado))).toBeTrue();
  });

  // Un rol no autorizado recibe aviso y vuelve a /procesos en lugar de ver una pantalla vacía.
  it('rolGuard_rolNoPermitido_avisaYRedirigeAProcesos', () => {
    iniciarSesion('SOLO_LECTURA');
    const router = preparar();
    const notificaciones = TestBed.inject(NotificacionService);
    spyOn(notificaciones, 'error');
    const resultado = TestBed.runInInjectionContext(() => rolGuard(ruta(['ADMINISTRADOR']), estado));
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/procesos');
    expect(notificaciones.error).toHaveBeenCalled();
  });

  // Una ruta mal configurada (sin roles) debe negar el acceso, nunca permitirlo por omisión.
  it('rolGuard_sinRolesEnLaRuta_niega', () => {
    iniciarSesion('ADMINISTRADOR');
    preparar();
    expect(TestBed.runInInjectionContext(() => rolGuard(ruta(), estado))).not.toBeTrue();
  });
});
