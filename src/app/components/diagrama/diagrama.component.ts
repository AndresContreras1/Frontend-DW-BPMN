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
  imports: [ActividadSvgComponent, GatewaySvgComponent, EventoSvgComponent],
  templateUrl: './diagrama.component.html'
})
export class DiagramaComponent {
  readonly datos = input.required<DatosDiagrama>();
  readonly seleccion = input<SeleccionDiagrama | null>(null);
  readonly seleccionar = output<SeleccionDiagrama>();

  readonly zoom = signal(1);
  readonly vista = computed(() => calcularDiagrama(this.datos()));
  readonly vacio = computed(() => this.datos().pools.length === 0);

  esSeleccionado(tipo: TipoElementoDiagrama, id: number): boolean {
    const actual = this.seleccion();
    return actual !== null && actual.tipo === tipo && actual.id === id;
  }

  elegir(tipo: TipoElementoDiagrama, id: number): void {
    this.seleccionar.emit({ tipo, id });
  }

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

  textoArco(etiqueta: string, condicion: string): string {
    return condicion ? etiqueta + ' [' + condicion + ']' : etiqueta;
  }

  acercar(): void {
    this.zoom.update((z) => Math.min(2, Math.round((z + 0.2) * 10) / 10));
  }

  alejar(): void {
    this.zoom.update((z) => Math.max(0.4, Math.round((z - 0.2) * 10) / 10));
  }

  restablecer(): void {
    this.zoom.set(1);
  }
}
