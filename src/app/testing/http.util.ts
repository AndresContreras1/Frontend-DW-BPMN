// Utilidad para probar servicios HTTP con HttpTestingController (el "servidor falso" de Angular).
// Reduce a una línea el patrón repetido: suscribirse, esperar la petición, verificar método y URL, y responder.
import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { Observable } from 'rxjs';

// Es genérica (<T>) para conservar el tipo de la respuesta; "respuesta" se restringe a tipos serializables en vez de any.
// Devuelve la petición (para revisar cuerpo o parámetros) y una función que entrega lo que recibió el suscriptor.
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
  // expectOne falla la prueba si no hay exactamente una petición que coincida, lo que detecta llamadas duplicadas o faltantes.
  const peticion = http.expectOne((r) => r.urlWithParams === url || r.url === url);
  expect(peticion.request.method).toBe(metodo);
  // flush responde la petición simulada; sin esto el observable nunca emitiría.
  peticion.flush(respuesta);
  return { peticion, resultado: () => recibido };
}
