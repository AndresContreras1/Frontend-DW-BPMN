// Clase base de los formularios del editor (pool, lane, actividad, gateway, evento, arco, mensaje).
// Concentra el patron 'enviar peticion -> bloquear boton -> mostrar errores del servidor' para no repetirlo.
// Conceptos: @Directive abstracta, output() (comunicacion hijo -> padre), signal() (estado reactivo), RxJS Observable.
// Clase base de los formularios del editor (pool, lane, actividad, gateway, evento, arco, mensaje).
// Concentra el patron 'enviar peticion -> bloquear boton -> mostrar errores del servidor' para no repetirlo.
// Conceptos: @Directive abstracta, output() (comunicacion hijo -> padre), signal() (estado reactivo), RxJS Observable.
// Clase base de los formularios del editor (pool, lane, actividad, gateway, evento, arco, mensaje).
// Concentra el patron 'enviar peticion -> bloquear boton -> mostrar errores del servidor' para no repetirlo.
// Conceptos: @Directive abstracta, output() (comunicacion hijo -> padre), signal() (estado reactivo), RxJS Observable.
import { Directive, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
// Utilidades que traducen un error HTTP (ProblemDetail del backend) a texto y a errores por campo.
// Utilidades que traducen un error HTTP (ProblemDetail del backend) a texto y a errores por campo.
// Utilidades que traducen un error HTTP (ProblemDetail del backend) a texto y a errores por campo.
import { erroresPorCampo, mensajeDeError } from '../utils/problema';

/**
 * Comportamiento común de los formularios del editor: estado de envío, errores del backend
 * (ProblemDetail) y los eventos hacia el padre. Cada formulario solo arma su petición.
 */
// @Directive() sin selector: permite que Angular procese los output()/inject() de una clase base
// que no es componente. Los formularios hijos la extienden con 'extends FormularioElementoBase<R>'.
// abstract: no se puede instanciar sola; el genérico R es el tipo de la respuesta del backend.
// @Directive() sin selector: permite que Angular procese los output()/inject() de una clase base
// que no es componente. Los formularios hijos la extienden con 'extends FormularioElementoBase<R>'.
// abstract: no se puede instanciar sola; el genérico R es el tipo de la respuesta del backend.
// @Directive() sin selector: permite que Angular procese los output()/inject() de una clase base
// que no es componente. Los formularios hijos la extienden con 'extends FormularioElementoBase<R>'.
// abstract: no se puede instanciar sola; el genérico R es el tipo de la respuesta del backend.
@Directive()
export abstract class FormularioElementoBase<R> {
  /** Evento hacia el padre: se emite con la respuesta del backend cuando la petición tuvo éxito. */
  /** Evento hacia el padre: se emite con la respuesta del backend cuando la petición tuvo éxito. */
  /** Evento hacia el padre: se emite con la respuesta del backend cuando la petición tuvo éxito. */
  readonly guardado = output<R>();
  /** Evento hacia el padre: el usuario cerró el formulario sin guardar. */
  /** Evento hacia el padre: el usuario cerró el formulario sin guardar. */
  /** Evento hacia el padre: el usuario cerró el formulario sin guardar. */
  readonly cancelar = output<void>();

  /** true mientras la petición está en curso; la plantilla lo usa para deshabilitar el botón (evita doble envío). */
  /** true mientras la petición está en curso; la plantilla lo usa para deshabilitar el botón (evita doble envío). */
  /** true mientras la petición está en curso; la plantilla lo usa para deshabilitar el botón (evita doble envío). */
  readonly enviando = signal(false);
  /** Mensaje general del error (si falló toda la operación y no un campo concreto). */
  /** Mensaje general del error (si falló toda la operación y no un campo concreto). */
  /** Mensaje general del error (si falló toda la operación y no un campo concreto). */
  readonly error = signal('');
  /** Errores de validación del backend indexados por nombre de campo; cada campo-formulario muestra el suyo. */
  /** Errores de validación del backend indexados por nombre de campo; cada campo-formulario muestra el suyo. */
  /** Errores de validación del backend indexados por nombre de campo; cada campo-formulario muestra el suyo. */
  readonly erroresServidor = signal<Record<string, string | undefined>>({});

  /**
   * Ejecuta la petición que arma cada formulario hijo. protected: solo la usan las clases hijas.
   * Flujo: marca 'enviando', limpia errores previos, se suscribe y al terminar emite 'guardado' o llena los errores.
   */
  /**
   * Ejecuta la petición que arma cada formulario hijo. protected: solo la usan las clases hijas.
   * Flujo: marca 'enviando', limpia errores previos, se suscribe y al terminar emite 'guardado' o llena los errores.
   */
  /**
   * Ejecuta la petición que arma cada formulario hijo. protected: solo la usan las clases hijas.
   * Flujo: marca 'enviando', limpia errores previos, se suscribe y al terminar emite 'guardado' o llena los errores.
   */
  protected enviar(peticion: Observable<R>): void {
    this.enviando.set(true);
    this.error.set('');
    this.erroresServidor.set({});
    // El Observable es 'frío': la petición HTTP no se hace hasta que alguien se suscribe, por eso se suscribe aquí.
    // El Observable es 'frío': la petición HTTP no se hace hasta que alguien se suscribe, por eso se suscribe aquí.
    // El Observable es 'frío': la petición HTTP no se hace hasta que alguien se suscribe, por eso se suscribe aquí.
    peticion.subscribe({
      // Éxito: se libera el botón y se avisa al padre con la respuesta (el padre decide recargar o cerrar).
      // Éxito: se libera el botón y se avisa al padre con la respuesta (el padre decide recargar o cerrar).
      // Éxito: se libera el botón y se avisa al padre con la respuesta (el padre decide recargar o cerrar).
      next: (resultado) => {
        this.enviando.set(false);
        this.guardado.emit(resultado);
      },
      // Fallo: unknown (en vez de any) obliga a tratar el error con las utilidades tipadas antes de usarlo.
      // Fallo: unknown (en vez de any) obliga a tratar el error con las utilidades tipadas antes de usarlo.
      // Fallo: unknown (en vez de any) obliga a tratar el error con las utilidades tipadas antes de usarlo.
      error: (e: unknown) => {
        this.enviando.set(false);
        this.erroresServidor.set(erroresPorCampo(e));
        this.error.set(mensajeDeError(e));
      }
    });
  }
}
