import { Component } from '@angular/core';

/** Leyenda de los símbolos del diagrama (para entender qué significa cada forma). */
@Component({
  selector: 'app-leyenda-diagrama',
  templateUrl: './leyenda-diagrama.component.html'
})
export class LeyendaDiagramaComponent {
  readonly simbolos = [
    { id: 'actividad', texto: 'Actividad (rectángulo redondeado)' },
    { id: 'exclusivo', texto: 'Gateway exclusivo (rombo con X)' },
    { id: 'paralelo', texto: 'Gateway paralelo (rombo con +)' },
    { id: 'inclusivo', texto: 'Gateway inclusivo (rombo con círculo)' },
    { id: 'throw', texto: 'Mensaje enviado (sobre relleno)' },
    { id: 'catchInicio', texto: 'Mensaje recibido al inicio (borde sencillo)' },
    { id: 'catchIntermedio', texto: 'Mensaje recibido intermedio (doble borde)' },
    { id: 'arco', texto: 'Arco: flujo de secuencia (línea continua)' },
    { id: 'mensaje', texto: 'Mensaje entre pools (línea punteada)' }
  ];
}
