// Pruebas de utils/problema.ts: garantizan que cada tipo de error del backend se traduzca al
// mensaje correcto, ya que los componentes dependen de este helper para informar al usuario.
import { HttpErrorResponse } from '@angular/common/http';
import { erroresPorCampo, mensajeDeError } from './problema';

// Fábrica de HttpErrorResponse para no repetir la construcción en cada prueba.
function error(status: number, cuerpo: unknown): HttpErrorResponse {
  return new HttpErrorResponse({ status, error: cuerpo });
}

// Agrupa las pruebas de mensajeDeError y erroresPorCampo.
describe('problema', () => {
  // Status 0 significa que el navegador no alcanzó el servidor; el usuario debe saber que el backend no responde.
  it('mensajeDeError_sinConexion_avisaQueNoHayServidor', () => {
    expect(mensajeDeError(error(0, null))).toContain('No se pudo conectar');
  });

  // El detail del backend es el mensaje más específico y tiene prioridad.
  it('mensajeDeError_conDetail_devuelveElDetail', () => {
    expect(mensajeDeError(error(409, { detail: 'Regla violada', title: 'Conflicto' }))).toBe('Regla violada');
  });

  // Si no hay detail, se usa el title como segunda opción.
  it('mensajeDeError_sinDetailConTitle_devuelveElTitle', () => {
    expect(mensajeDeError(error(500, { title: 'Error interno' }))).toBe('Error interno');
  });

  // Un error que no es HTTP (ej. un Error de JavaScript) recibe un mensaje genérico sin exponer detalles técnicos.
  it('mensajeDeError_errorDesconocido_devuelveMensajeGenerico', () => {
    expect(mensajeDeError(new Error('x'))).toContain('error inesperado');
  });

  // Valida el parseo de "campo: mensaje; campo: mensaje" para mostrar cada error junto a su input.
  it('erroresPorCampo_detailConFormatoCampoMensaje_separaLosCampos', () => {
    const resultado = erroresPorCampo(error(400, { detail: 'nombre: El nombre es obligatorio.; email: El correo no es valido.' }));
    expect(resultado['nombre']).toBe('El nombre es obligatorio.');
    expect(resultado['email']).toBe('El correo no es valido.');
  });

  // Si el backend envía el mapa "errors", se usa directamente.
  it('erroresPorCampo_conPropiedadErrors_laUsa', () => {
    expect(erroresPorCampo(error(400, { errors: { nit: 'Duplicado' } }))).toEqual({ nit: 'Duplicado' });
  });

  // Solo los 400 son errores de validación de formulario; otros estados no deben pintarse como errores de campo.
  it('erroresPorCampo_estadoDistintoDe400_devuelveVacio', () => {
    expect(erroresPorCampo(error(409, { detail: 'a: b' }))).toEqual({});
  });

  // Sin cuerpo no hay nada que interpretar: devuelve un objeto vacío en lugar de fallar.
  it('erroresPorCampo_sinCuerpo_devuelveVacio', () => {
    expect(erroresPorCampo(error(400, null))).toEqual({});
  });
});
