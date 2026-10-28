import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { Observable } from 'rxjs';

/**
 * Suscribe al observable, verifica método y URL de la petición y la responde.
 * Devuelve la petición (para revisar body/params) y la respuesta recibida por el suscriptor.
 */
export function probarPeticion<T>(
  http: HttpTestingController,
  llamada: Observable<T>,
  metodo: string,
  url: string,
  respuesta: object | string | number | boolean | null
): { peticion: TestRequest; resultado: () => T | undefined } {
  let recibido: T | undefined;
  llamada.subscribe((r) => (recibido = r));
  const peticion = http.expectOne((r) => r.urlWithParams === url || r.url === url);
  expect(peticion.request.method).toBe(metodo);
  peticion.flush(respuesta);
  return { peticion, resultado: () => recibido };
}
