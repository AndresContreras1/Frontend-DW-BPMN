// =============================================================================
// notificacion.service.ts
// Servicio de AVISOS (toasts) visibles para el usuario: éxito, error, etc.
// No consume backend. Concepto aplicado: signals como estado compartido; un
// componente de toasts lee notificaciones() y se re-renderiza al cambiar.
// Cualquier componente o servicio inyecta este servicio y llama exito()/error().
// =============================================================================
import { Injectable, signal } from '@angular/core';

/** Tipos de aviso; coinciden con las variantes de color de alerta (success, danger...). */
export type TipoNotificacion = 'success' | 'danger' | 'warning' | 'info';

/** Un aviso individual: el id permite cerrarlo de forma específica. */
export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
}

/** Avisos (toasts) compartidos por toda la aplicación. */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  // Contador para generar ids únicos (no necesita ser señal: no se muestra).
  private siguienteId = 1;
  // Señal escribible privada con la lista; se expone solo lectura abajo.
  private readonly lista = signal<Notificacion[]>([]);
  readonly notificaciones = this.lista.asReadonly();

  /** Muestra un aviso de éxito (verde). */
  exito(mensaje: string): void {
    this.agregar('success', mensaje);
  }

  /** Muestra un aviso de error (rojo). */
  error(mensaje: string): void {
    this.agregar('danger', mensaje);
  }

  /** Muestra un aviso de advertencia (amarillo). */
  advertencia(mensaje: string): void {
    this.agregar('warning', mensaje);
  }

  /** Muestra un aviso informativo. */
  info(mensaje: string): void {
    this.agregar('info', mensaje);
  }

  /**
   * Quita un aviso por id. update() recibe el valor actual y devuelve uno nuevo
   * (inmutabilidad: se crea un arreglo nuevo con filter, no se muta el existente).
   */
  cerrar(id: number): void {
    this.lista.update((actuales) => actuales.filter((n) => n.id !== id));
  }

  /**
   * Método común de los cuatro tipos: agrega el aviso (con spread, nuevo arreglo)
   * y programa su cierre automático a los 6 segundos con setTimeout.
   */
  private agregar(tipo: TipoNotificacion, mensaje: string): void {
    const id = this.siguienteId++;
    this.lista.update((actuales) => [...actuales, { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), 6000);
  }
}
