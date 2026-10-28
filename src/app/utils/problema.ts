// Interpreta los errores HTTP del backend (ProblemDetail) y los convierte en mensajes para
// el usuario o en errores por campo para los formularios. Centralizarlo evita repetir
// try/catch con textos distintos en cada componente.
import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../models/problem-detail.model';

// Mensajes constantes para los casos sin respuesta del servidor y sin información útil.
const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.';
const MENSAJE_GENERICO = 'Ocurrió un error inesperado. Intenta nuevamente.';

// Extrae el cuerpo del error de forma segura: la entrada es unknown (no any) y se verifica con instanceof antes de tratarla como ProblemDetail.
// Es un "type guard" manual: así TypeScript no permite acceder a campos sin comprobar.
function cuerpo(error: unknown): ProblemDetail | null {
  if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object') {
    return error.error as ProblemDetail;
  }
  return null;
}

// Prioridad: status 0 (sin conexión) > detail > title > mensaje genérico.
/** Texto legible para mostrar al usuario a partir de un error HTTP (ProblemDetail del backend). */
export function mensajeDeError(error: unknown): string {
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return MENSAJE_SIN_CONEXION;
  }
  const problema = cuerpo(error);
  if (problema?.detail) {
    return problema.detail;
  }
  return problema?.title ?? MENSAJE_GENERICO;
}

// Solo aplica a errores 400. Si viene "errors" se usa tal cual; si no, se parsea el detail con formato "campo: mensaje; campo: mensaje"
// dividiendo por ";" y por el primer ":" (separador > 0 evita partes sin nombre de campo).
/**
 * Errores de validación por campo. El backend devuelve en 400 un detail con el formato
 * "campo: mensaje; campo: mensaje" (o una propiedad errors campo -> mensaje).
 */
export function erroresPorCampo(error: unknown): Record<string, string> {
  const problema = cuerpo(error);
  if (!problema || (error instanceof HttpErrorResponse && error.status !== 400)) {
    return {};
  }
  if (problema.errors) {
    return { ...problema.errors };
  }
  const resultado: Record<string, string> = {};
  for (const parte of (problema.detail ?? '').split(';')) {
    const separador = parte.indexOf(':');
    if (separador > 0) {
      resultado[parte.slice(0, separador).trim()] = parte.slice(separador + 1).trim();
    }
  }
  return resultado;
}
