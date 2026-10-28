// =====================================================================================
// diagrama.component.ts
// Componente que DIBUJA el diagrama BPMN completo en un único <svg>, sin librerías externas
// (ni bpmn.js ni d3): todo es HTML/SVG escrito en la plantilla y controlado con signals.
// Flujo de datos: el padre entrega el modelo del backend (pools, lanes, nodos, arcos, mensajes)
// -> `calcularDiagrama` (utils/diagrama-layout) lo convierte en coordenadas absolutas
// -> la plantilla recorre esas coordenadas con @for y pinta rect/path/text.
// Cuando el usuario hace clic en un elemento, el componente NO decide nada: emite un Output
// con el tipo y el id, y el padre (editor o visor) abre el panel/detalle correspondiente.
// =====================================================================================
import { Component, computed, input, output, signal } from '@angular/core';
import { SeleccionDiagrama, TipoElementoDiagrama } from '../../models/seleccion-diagrama.model';
import { DatosDiagrama, calcularDiagrama, partirTexto } from '../../utils/diagrama-layout';
import { ActividadSvgComponent } from '../nodo-svg/actividad-svg.component';
import { EventoSvgComponent } from '../nodo-svg/evento-svg.component';
import { GatewaySvgComponent } from '../nodo-svg/gateway-svg.component';

/**
 * Visor del diagrama BPMN en SVG propio (sin librerías). Recibe el modelo del backend,
 * calcula las coordenadas y avisa con Output qué elemento eligió el usuario.
 */
@Component({
  selector: 'app-diagrama',
  // Los tres componentes de nodo se importan porque la plantilla los usa (standalone: no hay NgModule).
  imports: [ActividadSvgComponent, GatewaySvgComponent, EventoSvgComponent],
  templateUrl: './diagrama.component.html'
})
export class DiagramaComponent {
  /** Modelo del proceso a dibujar (pools, lanes, nodos, arcos y mensajes). Entrada obligatoria: sin datos no hay dibujo. */
  readonly datos = input.required<DatosDiagrama>();
  /** Elemento actualmente seleccionado en el padre (o null); sirve solo para resaltarlo con una clase CSS. */
  readonly seleccion = input<SeleccionDiagrama | null>(null);
  /** Output: avisa al padre qué elemento (tipo + id) eligió el usuario con un clic. */
  readonly seleccionar = output<SeleccionDiagrama>();

  /** Factor de zoom (1 = 100%). Es un signal porque la plantilla debe redibujar el tamaño cuando cambia. */
  readonly zoom = signal(1);
  /**
   * Coordenadas ya calculadas. Es un computed: se recalcula SOLO cuando cambia `datos()`,
   * así el layout no se repite en cada detección de cambios.
   */
  readonly vista = computed(() => calcularDiagrama(this.datos()));
  /** True si el proceso aún no tiene pools; la plantilla muestra un mensaje en lugar del SVG. */
  readonly vacio = computed(() => this.datos().pools.length === 0);

  /** Indica si el elemento (tipo, id) es el seleccionado; se necesita el tipo porque un pool y una lane pueden compartir id. */
  esSeleccionado(tipo: TipoElementoDiagrama, id: number): boolean {
    const actual = this.seleccion();
    return actual !== null && actual.tipo === tipo && actual.id === id;
  }

  /** Reacción al clic: emite la selección hacia el padre (el componente no guarda estado de selección propio). */
  elegir(tipo: TipoElementoDiagrama, id: number): void {
    this.seleccionar.emit({ tipo, id });
  }

  /**
   * Arma las líneas de texto de la etiqueta de un mensaje: el nombre (máx. 28 caracteres por línea y 2 líneas),
   * luego la clave de correlación (si tiene) y, si el mensaje va hacia una empresa externa, su destino.
   */
  lineasMensaje(nombre: string, clave: string, destino: string): string[] {
    const lineas = partirTexto(nombre, 28, 2);
    if (clave) {
      lineas.push('clave: ' + clave);
    }
    if (destino) {
      lineas.push('→ ' + destino);
    }
    return lineas;
  }

  /** Texto de la etiqueta de un arco: "etiqueta [condición]"; la condición solo existe en arcos que salen de gateways divergentes. */
  textoArco(etiqueta: string, condicion: string): string {
    return condicion ? etiqueta + ' [' + condicion + ']' : etiqueta;
  }

  /** Sube el zoom 0.2 hasta un máximo de 2 (200%). El redondeo a 1 decimal evita errores de coma flotante (0.6000000001). */
  acercar(): void {
    this.zoom.update((z) => Math.min(2, Math.round((z + 0.2) * 10) / 10));
  }

  /** Baja el zoom 0.2 hasta un mínimo de 0.4 (40%). */
  alejar(): void {
    this.zoom.update((z) => Math.max(0.4, Math.round((z - 0.2) * 10) / 10));
  }

  /** Vuelve al zoom original (100%). */
  restablecer(): void {
    this.zoom.set(1);
  }
}
