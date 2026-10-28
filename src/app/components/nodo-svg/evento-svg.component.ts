// =====================================================================================
// evento-svg.component.ts
// Dibuja un EVENTO DE MENSAJE BPMN: círculo con un sobre dentro. Es la forma que conecta un pool con otro,
// porque los mensajes entre pools salen de un evento throw (envía) y llegan a un evento catch (recibe).
// Selector de atributo g[app-evento-svg] (el componente es un <g> SVG) y herencia de NodoSvgBase.
// =====================================================================================
import { Component, computed } from '@angular/core';
import { partirTexto } from '../../utils/diagrama-layout';
import { NodoSvgBase } from './nodo-svg.base';

/**
 * Evento de mensaje: círculo con sobre.
 * Sobre relleno = envío (throw); sobre sin relleno = recepción (catch).
 * Borde sencillo = catch de inicio; doble borde = catch intermedio.
 */
@Component({
  selector: 'g[app-evento-svg]',
  templateUrl: './evento-svg.component.html',
  // Configuración del <g> anfitrión: posición, resaltado de selección y reemisión del clic.
  host: {
    class: 'dg-nodo',
    '[attr.transform]': 'transformacion()',
    '[class.dg-seleccionado]': 'seleccionado()',
    '(click)': 'seleccionar.emit()'
  }
})
export class EventoSvgComponent extends NodoSvgBase {
  /** True si el evento envía el mensaje (subtipo THROW); decide si el sobre se rellena. */
  readonly esEnvio = computed(() => this.nodo().subtipo === 'THROW');
  /** True si es un catch intermedio (ocurre a mitad del flujo); se dibuja con un segundo círculo interior. */
  readonly esIntermedio = computed(() => this.nodo().subtipo === 'CATCH_INTERMEDIO');
  /** Nombre en líneas de máx. 18 caracteres y 2 líneas; se escribe DEBAJO del círculo porque no cabe dentro. */
  readonly lineas = computed(() => partirTexto(this.nodo().nombre, 18, 2));
}
