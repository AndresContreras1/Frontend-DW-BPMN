import { HttpErrorResponse } from '@angular/common/http';
import { erroresPorCampo, mensajeDeError } from './problema';

function error(status: number, cuerpo: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: cuerpo });
}

describe('problema', () => {
  it('mensajeDeError_sinConexion_avisaQueNoHayServidor', () => {
    expect(mensajeDeError(error(0, null))).toContain('No se pudo conectar');
  });

  it('mensajeDeError_conDetail_devuelveElDetail', () => {
    expect(mensajeDeError(error(409, { detail: 'Regla violada', title: 'Conflicto' }))).toBe('Regla violada');
  });

  it('mensajeDeError_sinDetailConTitle_devuelveElTitle', () => {
    expect(mensajeDeError(error(500, { title: 'Error interno' }))).toBe('Error interno');
  });

  it('mensajeDeError_errorDesconocido_devuelveMensajeGenerico', () => {
    expect(mensajeDeError(new Error('x'))).toContain('error inesperado');
  });

  it('erroresPorCampo_detailConFormatoCampoMensaje_separaLosCampos', () => {
    const resultado = erroresPorCampo(error(400, { detail: 'nombre: El nombre es obligatorio.; email: El correo no es valido.' }));
    expect(resultado['nombre']).toBe('El nombre es obligatorio.');
    expect(resultado['email']).toBe('El correo no es valido.');
  });

  it('erroresPorCampo_conPropiedadErrors_laUsa', () => {
    expect(erroresPorCampo(error(400, { errors: { nit: 'Duplicado' } }))).toEqual({ nit: 'Duplicado' });
  });

  it('erroresPorCampo_estadoDistintoDe400_devuelveVacio', () => {
    expect(erroresPorCampo(error(409, { detail: 'a: b' }))).toEqual({});
  });

  it('erroresPorCampo_sinCuerpo_devuelveVacio', () => {
    expect(erroresPorCampo(error(400, null))).toEqual({});
  });
});
