// =============================================================================
// notificacion.service.spec.ts
// Pruebas de NotificacionService (avisos/toasts basados en signals). El servicio
// no depende de otros, por eso se instancia con `new` sin TestBed. Para probar
// el cierre automático con setTimeout se usa fakeAsync + tick: un reloj
// simulado que permite "avanzar" el tiempo sin esperar de verdad.
// =============================================================================
import { fakeAsync, tick } from '@angular/core/testing';
import { NotificacionService } from './notificacion.service';

/** Pruebas del servicio de avisos compartidos. */
describe('NotificacionService', () => {
  // Cada método público (exito/error/advertencia/info) debe registrar el tipo
  // correcto, que el componente de toasts traduce a un color.
  it('agrega_notificacionesDeCadaTipo', () => {
    const service = new NotificacionService();
    service.exito('a');
    service.error('b');
    service.advertencia('c');
    service.info('d');
    expect(service.notificaciones().map((n) => n.tipo)).toEqual(['success', 'danger', 'warning', 'info']);
  });

  // El usuario puede cerrar un aviso manualmente por su id; la lista debe quedar vacía.
  it('cerrar_quitaLaNotificacion', () => {
    const service = new NotificacionService();
    service.exito('a');
    service.cerrar(service.notificaciones()[0].id);
    expect(service.notificaciones().length).toBe(0);
  });

  // Los avisos se autodestruyen a los 6000 ms; tick(6000) adelanta el reloj
  // simulado esos 6 s y se comprueba que la lista quedó vacía, sin esperar realmente.
  it('notificacion_desapareceSola', fakeAsync(() => {
    const service = new NotificacionService();
    service.exito('a');
    tick(6000);
    expect(service.notificaciones().length).toBe(0);
  }));
});
