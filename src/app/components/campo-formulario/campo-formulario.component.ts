// Componente reutilizable (standalone) que pinta un campo de formulario completo:
// etiqueta + control (input/textarea/select) + ayuda + mensajes de error. Evita repetir esa estructura en cada formulario.
// Componente reutilizable (standalone) que pinta un campo de formulario completo:
// etiqueta + control (input/textarea/select) + ayuda + mensajes de error. Evita repetir esa estructura en cada formulario.
// Componente reutilizable (standalone) que pinta un campo de formulario completo:
// etiqueta + control (input/textarea/select) + ayuda + mensajes de error. Evita repetir esa estructura en cada formulario.
import { Component, computed, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { OpcionLista } from '../../models/enums.model';

// Unión de literales: restringe 'tipo' a los valores que la plantilla sabe dibujar (chequeo en compilación).
// Unión de literales: restringe 'tipo' a los valores que la plantilla sabe dibujar (chequeo en compilación).
// Unión de literales: restringe 'tipo' a los valores que la plantilla sabe dibujar (chequeo en compilación).
export type TipoCampo = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';

/** Campo de formulario reactivo con etiqueta, validación de Bootstrap y mensajes de error. */
@Component({
  selector: 'app-campo-formulario',
  // Standalone: declara aquí sus dependencias. ReactiveFormsModule aporta la directiva [formControl] usada en la plantilla.
  // Standalone: declara aquí sus dependencias. ReactiveFormsModule aporta la directiva [formControl] usada en la plantilla.
  // Standalone: declara aquí sus dependencias. ReactiveFormsModule aporta la directiva [formControl] usada en la plantilla.
  imports: [ReactiveFormsModule],
  templateUrl: './campo-formulario.component.html'
})
export class CampoFormularioComponent {
  /** FormControl del padre (formulario reactivo). input.required: el padre está obligado a pasarlo. */
  /** FormControl del padre (formulario reactivo). input.required: el padre está obligado a pasarlo. */
  /** FormControl del padre (formulario reactivo). input.required: el padre está obligado a pasarlo. */
  readonly control = input.required<FormControl<string>>();
  /** id del elemento; la etiqueta lo enlaza con [for] (accesibilidad) y las pruebas lo usan como selector. */
  /** id del elemento; la etiqueta lo enlaza con [for] (accesibilidad) y las pruebas lo usan como selector. */
  /** id del elemento; la etiqueta lo enlaza con [for] (accesibilidad) y las pruebas lo usan como selector. */
  readonly idCampo = input.required<string>();
  /** Texto visible de la etiqueta (label). */
  /** Texto visible de la etiqueta (label). */
  /** Texto visible de la etiqueta (label). */
  readonly etiqueta = input.required<string>();
  /** Qué control dibujar; por defecto un input de texto. input() con valor inicial = entrada opcional. */
  /** Qué control dibujar; por defecto un input de texto. input() con valor inicial = entrada opcional. */
  /** Qué control dibujar; por defecto un input de texto. input() con valor inicial = entrada opcional. */
  readonly tipo = input<TipoCampo>('text');
  /** Opciones del select (solo se usa cuando tipo es 'select'). */
  /** Opciones del select (solo se usa cuando tipo es 'select'). */
  /** Opciones del select (solo se usa cuando tipo es 'select'). */
  readonly opciones = input<OpcionLista[]>([]);
  /** Texto de ayuda opcional bajo el campo. */
  /** Texto de ayuda opcional bajo el campo. */
  /** Texto de ayuda opcional bajo el campo. */
  readonly ayuda = input<string>('');
  /** Texto guía dentro del campo vacío. */
  /** Texto guía dentro del campo vacío. */
  /** Texto guía dentro del campo vacío. */
  readonly placeholder = input<string>('');
  /** Error devuelto por el backend para este campo (se muestra junto a los del navegador). */
  readonly errorServidor = input<string>('');

  /**
   * Decide si se pinta el estado de error. Solo después de que el usuario tocó el campo (touched),
   * para no mostrar errores rojos en un formulario recién abierto. Incluye el error que devolvió el backend.
   */
  /**
   * Decide si se pinta el estado de error. Solo después de que el usuario tocó el campo (touched),
   * para no mostrar errores rojos en un formulario recién abierto. Incluye el error que devolvió el backend.
   */
  /**
   * Decide si se pinta el estado de error. Solo después de que el usuario tocó el campo (touched),
   * para no mostrar errores rojos en un formulario recién abierto. Incluye el error que devolvió el backend.
   */
  mostrarError(): boolean {
    const c = this.control();
    return c.touched && (c.invalid || this.errorServidor() !== '');
  }

  /**
   * Convierte los errores del control (clave -> detalle) en frases en español.
   * Las claves 'required', 'email', 'minlength', etc. las genera Angular según el Validator aplicado.
   */
  /**
   * Convierte los errores del control (clave -> detalle) en frases en español.
   * Las claves 'required', 'email', 'minlength', etc. las genera Angular según el Validator aplicado.
   */
  /**
   * Convierte los errores del control (clave -> detalle) en frases en español.
   * Las claves 'required', 'email', 'minlength', etc. las genera Angular según el Validator aplicado.
   */
  mensajes(): string[] {
    const errores = this.control().errors;
    const lista: string[] = [];
    if (errores) {
      if (errores['required']) {
        lista.push('Este campo es obligatorio.');
      }
      if (errores['email']) {
        lista.push('El correo no tiene un formato válido.');
      }
      if (errores['minlength']) {
        lista.push('Debe tener al menos ' + errores['minlength'].requiredLength + ' caracteres.');
      }
      if (errores['maxlength']) {
        lista.push('Debe tener máximo ' + errores['maxlength'].requiredLength + ' caracteres.');
      }
      if (errores['min']) {
        lista.push('El valor mínimo es ' + errores['min'].min + '.');
      }
      if (errores['pattern']) {
        lista.push('El formato no es válido.');
      }
    }
    // El error del servidor se agrega al final, junto a los de validación del navegador.
    // El error del servidor se agrega al final, junto a los de validación del navegador.
    // El error del servidor se agrega al final, junto a los de validación del navegador.
    if (this.errorServidor()) {
      lista.push(this.errorServidor());
    }
    return lista;
  }
}
