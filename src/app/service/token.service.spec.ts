import { TestBed } from '@angular/core/testing';
import { UsuarioResponse } from '../models/usuario.model';
import { TokenService } from './token.service';

const usuario: UsuarioResponse = { id: 1, nombre: 'Ana', email: 'ana@demo.com', rolAcceso: 'EDITOR', activo: true };

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
  });

  it('guardarSesion_guardaTokenYUsuario', () => {
    service.guardarSesion('abc', usuario);
    expect(service.obtenerToken()).toBe('abc');
    expect(service.obtenerUsuario()).toEqual(usuario);
  });

  it('obtenerUsuario_sinDatos_devuelveNull', () => {
    expect(service.obtenerUsuario()).toBeNull();
  });

  it('obtenerUsuario_jsonInvalido_devuelveNull', () => {
    localStorage.setItem('usuario', '{no es json');
    expect(service.obtenerUsuario()).toBeNull();
  });

  it('limpiar_borraLaSesion', () => {
    service.guardarSesion('abc', usuario);
    service.limpiar();
    expect(service.obtenerToken()).toBeNull();
    expect(service.obtenerUsuario()).toBeNull();
  });
});
