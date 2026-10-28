import { Injectable, signal } from '@angular/core';

export type TipoNotificacion = 'success' | 'danger' | 'warning' | 'info';

export interface Notificacion {
  id: number;
  tipo: TipoNotificacion;
  mensaje: string;
}

/** Avisos (toasts) compartidos por toda la aplicación. */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private siguienteId = 1;
  private readonly lista = signal<Notificacion[]>([]);
  readonly notificaciones = this.lista.asReadonly();

  exito(mensaje: string): void {
    this.agregar('success', mensaje);
  }

  error(mensaje: string): void {
    this.agregar('danger', mensaje);
  }

  advertencia(mensaje: string): void {
    this.agregar('warning', mensaje);
  }

  info(mensaje: string): void {
    this.agregar('info', mensaje);
  }

  cerrar(id: number): void {
    this.lista.update((actuales) => actuales.filter((n) => n.id !== id));
  }

  private agregar(tipo: TipoNotificacion, mensaje: string): void {
    const id = this.siguienteId++;
    this.lista.update((actuales) => [...actuales, { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), 6000);
  }
}
