// =============================================================================
// token.service.spec.ts
// Pruebas UNITARIAS de TokenService (persistencia de la sesión en localStorage).
// Como el servicio no usa HTTP, no hace falta HttpTestingController: basta con
// TestBed.inject para obtener la instancia real y verificar sus efectos sobre
// localStorage (que existe en el navegador donde corre Karma/Jasmine).
// =============================================================================
import { TestBed } from '@angular/core/testing';
import { UsuarioResponse } from '../models/usuario.model';
import { TokenService } from './token.service';

// Usuario de ejemplo reutilizado por las pruebas (dato de prueba, no real).
const usuario: UsuarioResponse = { id: 1, nombre: 'Ana', email: 'ana@demo.com', rolAcceso: 'EDITOR', activo: true };

/** Agrupa las pruebas del servicio que guarda/lee el token y el usuario. */
describe('TokenService', () => {
  let service: TokenService;

  // Antes de CADA prueba: se vacía localStorage para que ninguna dependa del
  // estado que dejó otra (aislamiento) y se obtiene una instancia nueva del servicio.
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
  });

  // Valida el camino feliz: lo que se guarda es lo mismo que se recupera. Importa
  // porque de esto depende que la sesión sobreviva a recargar la página.
  it('guardarSesion_guardaTokenYUsuario', () => {
    service.guardarSesion('abc', usuario);
    expect(service.obtenerToken()).toBe('abc');
    expect(service.obtenerUsuario()).toEqual(usuario);
  });

  // Sin sesión previa debe devolver null (y no fallar): caso de un usuario que
  // entra por primera vez.
  it('obtenerUsuario_sinDatos_devuelveNull', () => {
    expect(service.obtenerUsuario()).toBeNull();
  });

  // Robustez: si el texto guardado no es JSON válido, el try/catch del servicio
  // debe devolver null en lugar de lanzar una excepción que rompa el arranque.
  it('obtenerUsuario_jsonInvalido_devuelveNull', () => {
    localStorage.setItem('usuario', '{no es json');
    expect(service.obtenerUsuario()).toBeNull();
  });

  // Cierre de sesión: tras limpiar() no debe quedar ni token ni usuario, así un
  // usuario siguiente en el mismo navegador no hereda la sesión anterior.
  it('limpiar_borraLaSesion', () => {
    service.guardarSesion('abc', usuario);
    service.limpiar();
    expect(service.obtenerToken()).toBeNull();
    expect(service.obtenerUsuario()).toBeNull();
  });
});
