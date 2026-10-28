import { TestBed } from '@angular/core/testing';
import { SeleccionDiagrama } from '../../models/seleccion-diagrama.model';
import { diagramaEjemplo } from '../../testing/datos';
import { describirElemento } from '../../utils/descripcion-elemento';
import { DetalleElementoComponent } from '../detalle-elemento/detalle-elemento.component';
import { LeyendaDiagramaComponent } from '../leyenda-diagrama/leyenda-diagrama.component';
import { VisorProcesoComponent } from '../visor-proceso/visor-proceso.component';
import { DiagramaComponent } from './diagrama.component';

// Pruebas del diagrama SVG: se renderiza con datos de ejemplo (testing/datos) y se consulta el DOM con ids
// como #pool1 o #arco200, que la plantilla construye con tipo + id.
describe('DiagramaComponent', () => {
  // Utilidad: crea el componente, le pasa los datos y la selección con setInput (forma de dar inputs en pruebas) y renderiza.
  function crear(seleccion: SeleccionDiagrama | null = null) {
    const fixture = TestBed.createComponent(DiagramaComponent);
    fixture.componentRef.setInput('datos', diagramaEjemplo);
    fixture.componentRef.setInput('seleccion', seleccion);
    fixture.detectChanges();
    return fixture;
  }

  // Valida que cada tipo de elemento del modelo aparece en el SVG: pool de caja negra, lane con su rol, 2 actividades,
  // símbolo del gateway, evento throw (sobre lleno), 4 arcos y el mensaje con su clave de correlación.
  it('dibuja_poolsLanesNodosArcosYMensajes', () => {
    const el: HTMLElement = crear().nativeElement;
    expect(el.querySelector('#pool1')).not.toBeNull();
    expect(el.querySelector('#pool2')?.textContent).toContain('caja negra');
    expect(el.querySelector('#lane11')?.textContent).toContain('Jefe directo');
    expect(el.querySelectorAll('[id^="actividad"]').length).toBe(2);
    expect(el.querySelector('#gateway102 path.dg-simbolo')).not.toBeNull();
    expect(el.querySelector('#evento103 rect.dg-sobre-lleno')).not.toBeNull();
    expect(el.querySelectorAll('[id^="arco"]').length).toBe(4);
    expect(el.querySelector('#mensaje300 path.dg-mensaje')).not.toBeNull();
    expect(el.querySelector('#mensaje300')?.textContent).toContain('clave: idSolicitud');
  });

  // Un arco que sale de un gateway divergente muestra "etiqueta [condición]" (regla del backend: condición obligatoria ahí).
  it('arcoConCondicion_muestraEtiquetaYCondicion', () => {
    const el: HTMLElement = crear().nativeElement;
    expect(el.querySelector('#arco202')?.textContent).toContain('Sí [aprobada == true]');
  });

  // Simula un clic en un elemento de cada tipo y comprueba que el Output `seleccionar` emite el tipo e id correctos, en orden.
  it('clicEnElementos_emiteLaSeleccion', () => {
    const fixture = crear();
    const el: HTMLElement = fixture.nativeElement;
    const emitidos: SeleccionDiagrama[] = [];
    fixture.componentInstance.seleccionar.subscribe((s) => emitidos.push(s));
    for (const id of ['pool1', 'lane10', 'arco200', 'mensaje300', 'actividad100', 'gateway102', 'evento103']) {
      el.querySelector<SVGGElement>('#' + id)?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
    expect(emitidos.map((s) => s.tipo)).toEqual(['pool', 'lane', 'arco', 'mensaje', 'actividad', 'gateway', 'evento']);
    expect(emitidos[4]).toEqual({ tipo: 'actividad', id: 100 });
  });

  // El input `seleccion` resalta solo el nodo elegido con la clase dg-seleccionado.
  it('elementoSeleccionado_quedaMarcado', () => {
    const el: HTMLElement = crear({ tipo: 'actividad', id: 101 }).nativeElement;
    expect(el.querySelector('#actividad101')?.classList).toContain('dg-seleccionado');
    expect(el.querySelector('#actividad100')?.classList).not.toContain('dg-seleccionado');
  });

  // Zoom: pasos de 0.2, restablecer vuelve a 1 y hay topes (máximo 2, mínimo 0.4).
  it('zoom_acercaAlejaYRestablece', () => {
    const fixture = crear();
    const c = fixture.componentInstance;
    c.acercar();
    expect(c.zoom()).toBe(1.2);
    c.alejar();
    c.alejar();
    expect(c.zoom()).toBe(0.8);
    c.restablecer();
    expect(c.zoom()).toBe(1);
    for (let i = 0; i < 10; i++) {
      c.acercar();
    }
    expect(c.zoom()).toBe(2);
    for (let i = 0; i < 20; i++) {
      c.alejar();
    }
    expect(c.zoom()).toBe(0.4);
  });

  // Sin pools no se dibuja el SVG: aparece el texto del estado vacío.
  it('sinPools_muestraElMensajeVacio', () => {
    const fixture = TestBed.createComponent(DiagramaComponent);
    fixture.componentRef.setInput('datos', { ...diagramaEjemplo, pools: [], lanes: [] });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#txtDiagramaVacio')).not.toBeNull();
  });
});

// Pruebas de las formas de nodo (símbolos BPMN), renderizadas a través del diagrama.
describe('Formas SVG segun el tipo', () => {
  // Catch de inicio = 1 círculo; catch intermedio = 2 círculos (doble borde); throw sería sobre lleno.
  // Gateway paralelo = símbolo "+" (path con V/H); inclusivo = círculo interior.
  it('eventos_dibujanBordeSencilloODobleSegunElTipo', () => {
    const fixture = TestBed.createComponent(DiagramaComponent);
    fixture.componentRef.setInput('datos', {
      ...diagramaEjemplo,
      eventos: [
        { ...diagramaEjemplo.eventos[0], id: 1, tipoEvento: 'CATCH_INICIO' },
        { ...diagramaEjemplo.eventos[0], id: 2, tipoEvento: 'CATCH_INTERMEDIO', posicionX: 620 }
      ],
      gateways: [
        { ...diagramaEjemplo.gateways[0], id: 3, tipoGateway: 'PARALELO' },
        { ...diagramaEjemplo.gateways[0], id: 4, tipoGateway: 'INCLUSIVO', posicionX: 500 }
      ],
      arcos: [],
      mensajes: []
    });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('#evento1 circle').length).toBe(1);
    expect(el.querySelectorAll('#evento2 circle').length).toBe(2);
    expect(el.querySelector('#evento1 rect.dg-sobre-lleno')).toBeNull();
    expect(el.querySelector('#gateway3 path')?.getAttribute('d')).toContain('V');
    expect(el.querySelector('#gateway4 circle.dg-simbolo')).not.toBeNull();
  });
});

// Pruebas de los componentes de lectura: detalle del elemento, visor que une diagrama + detalle, y leyenda.
describe('Detalle y visor', () => {
  // La función pura describirElemento devuelve filas de detalle para los 7 tipos y null si no hay selección o el id no existe.
  it('describirElemento_cubreTodosLosTipos', () => {
    const tipos: SeleccionDiagrama[] = [
      { tipo: 'pool', id: 1 }, { tipo: 'lane', id: 10 }, { tipo: 'actividad', id: 100 }, { tipo: 'gateway', id: 102 },
      { tipo: 'evento', id: 103 }, { tipo: 'arco', id: 202 }, { tipo: 'mensaje', id: 300 }
    ];
    for (const s of tipos) {
      const d = describirElemento(diagramaEjemplo, s);
      expect(d).not.toBeNull();
      expect(d?.filas.length).toBeGreaterThan(1);
    }
    expect(describirElemento(diagramaEjemplo, null)).toBeNull();
    expect(describirElemento(diagramaEjemplo, { tipo: 'pool', id: 999 })).toBeNull();
    const mensaje = describirElemento(diagramaEjemplo, { tipo: 'mensaje', id: 300 });
    expect(mensaje?.filas.find((f) => f.etiqueta === 'Message Throw')?.valor).toBe('NotificarPago');
    expect(mensaje?.filas.find((f) => f.etiqueta === 'Destino externo')?.valor).toContain('Servicio web');
  });

  // Sin selección el panel de detalle muestra la invitación a elegir un elemento.
  it('detalleElemento_sinSeleccion_pideSeleccionar', () => {
    const fixture = TestBed.createComponent(DetalleElementoComponent);
    fixture.componentRef.setInput('datos', diagramaEjemplo);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#txtSinSeleccion')).not.toBeNull();
  });

  // Integración: un clic en el gateway del diagrama actualiza la selección del visor y el panel muestra su detalle; la leyenda está presente.
  it('visor_alElegirUnElemento_muestraSuDetalle', () => {
    const fixture = TestBed.createComponent(VisorProcesoComponent);
    fixture.componentRef.setInput('datos', diagramaEjemplo);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    el.querySelector<SVGGElement>('#gateway102')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(el.querySelector('#panelDetalleElemento')?.textContent).toContain('Aprobada');
    expect(el.querySelector('#leyendaDiagrama')).not.toBeNull();
  });

  // La leyenda explica 9 símbolos (uno por <li>); si se agrega o quita uno, esta prueba lo detecta.
  it('leyenda_listaTodosLosSimbolos', () => {
    const fixture = TestBed.createComponent(LeyendaDiagramaComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('li').length).toBe(9);
  });
});
