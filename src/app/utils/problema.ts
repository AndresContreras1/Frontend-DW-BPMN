import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../models/problem-detail.model';

const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.';
const MENSAJE_GENERICO = 'Ocurrió un error inesperado. Intenta nuevamente.';

function cuerpo(error: unknown): ProblemDetail | null {
  if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object') {
    return error.error as ProblemDetail;
  }
  return null;
}

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
