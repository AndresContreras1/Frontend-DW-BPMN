import { fakeAsync, tick } from '@angular/core/testing';
import { NotificacionService } from './notificacion.service';

describe('NotificacionService', () => {
  it('agrega_notificacionesDeCadaTipo', () => {
    const service = new NotificacionService();
    service.exito('a');
    service.error('b');
    service.advertencia('c');
    service.info('d');
    expect(service.notificaciones().map((n) => n.tipo)).toEqual(['success', 'danger', 'warning', 'info']);
  });

  it('cerrar_quitaLaNotificacion', () => {
    const service = new NotificacionService();
    service.exito('a');
    service.cerrar(service.notificaciones()[0].id);
    expect(service.notificaciones().length).toBe(0);
  });

  it('notificacion_desapareceSola', fakeAsync(() => {
    const service = new NotificacionService();
    service.exito('a');
    tick(6000);
    expect(service.notificaciones().length).toBe(0);
  }));
});
