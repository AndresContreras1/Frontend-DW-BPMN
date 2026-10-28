// Pruebas unitarias del motor de layout del diagrama. Validan que el cálculo geométrico sea
// correcto sin renderizar nada, usando el modelo de ejemplo de testing/datos.ts.
import { diagramaEjemplo } from '../testing/datos';
import { DatosDiagrama, calcularDiagrama, partirTexto } from './diagrama-layout';

// Agrupa las pruebas del ajuste de texto dentro de las formas SVG (SVG no hace salto de línea automático).
describe('partirTexto', () => {
  // Un texto que cabe no debe partirse.
  it('textoCorto_devuelveUnaLinea', () => {
    expect(partirTexto('Revisar', 17)).toEqual(['Revisar']);
  });

  // Debe cortar en límites de palabra, no a mitad de palabra.
  it('textoLargo_seParteEnPalabras', () => {
    expect(partirTexto('Radicar solicitud de vacaciones', 17)).toEqual(['Radicar solicitud', 'de vacaciones']);
  });

  // Si hay más líneas que el máximo, la última se recorta con "…" para que el texto no se salga de la forma.
  it('masLineasQueElMaximo_recortaConPuntosSuspensivos', () => {
    const lineas = partirTexto('uno dos tres cuatro cinco seis siete', 5, 2);
    expect(lineas.length).toBe(2);
    expect(lineas[1].endsWith('…')).toBeTrue();
  });

  // Un texto de solo espacios no debe producir líneas.
  it('textoVacio_devuelveListaVacia', () => {
    expect(partirTexto('   ', 10)).toEqual([]);
  });
});

// Pruebas del cálculo principal; la vista se calcula una sola vez porque la función es pura.
describe('calcularDiagrama', () => {
  const vista = calcularDiagrama(diagramaEjemplo);

  // Los pools se ordenan y apilan; la caja negra es un rectángulo bajo y sin lanes.
  it('pools_seApilanEnOrdenYLaCajaNegraEsUnRectanguloBajo', () => {
    expect(vista.pools.map((p) => p.id)).toEqual([1, 2]);
    expect(vista.pools[1].y).toBeGreaterThan(vista.pools[0].y + vista.pools[0].alto);
    expect(vista.pools[1].cajaNegra).toBeTrue();
    expect(vista.pools[1].alto).toBeLessThan(100);
  });

  // Las lanes se apilan sin huecos y la altura del pool es la suma de sus lanes.
  it('lanes_seApilanDentroDelPoolConLaAlturaMinima', () => {
    expect(vista.lanes.length).toBe(2);
    expect(vista.lanes[1].y).toBe(vista.lanes[0].y + vista.lanes[0].alto);
    expect(vista.pools[0].alto).toBe(vista.lanes[0].alto + vista.lanes[1].alto);
    expect(vista.lanes[0].nombre).toBe('Empleado');
    expect(vista.lanes[1].nombre).toBe('Jefe directo');
  });

  // Convierte la posición relativa a la lane en absoluta (suma el desplazamiento de la lane y de la etiqueta lateral).
  it('nodos_usanLaPosicionRelativaALaLane', () => {
    const radicar = vista.nodos.find((n) => n.id === 100);
    const revisar = vista.nodos.find((n) => n.id === 101);
    expect(radicar?.x).toBe(vista.lanes[0].x + 32 + 80);
    expect(radicar?.y).toBe(vista.lanes[0].y + 60);
    expect(revisar?.y).toBe(vista.lanes[1].y + 60);
    expect(vista.nodos.map((n) => n.tipo)).toEqual(['actividad', 'actividad', 'gateway', 'evento']);
  });

  // Cada arco del modelo genera un trazado SVG válido (empieza con "M") que conserva su condición.
  it('arcos_hayUnoPorCadaArcoDelModeloConPuntaHaciaElDestino', () => {
    expect(vista.arcos.length).toBe(4);
    expect(vista.arcos.every((a) => a.d.startsWith('M '))).toBeTrue();
    expect(vista.arcos.find((a) => a.id === 202)?.condicion).toBe('aprobada == true');
  });

  // Un flujo hacia atrás (bucle) debe rodear usando lados verticales para no atravesar los nodos.
  it('arcoHaciaAtras_usaLadosVerticales', () => {
    const atras = vista.arcos.find((a) => a.id === 203);
    expect(atras?.d).toContain(' V ');
    expect(atras?.d).not.toContain(' H ' + vista.nodos[0].x);
  });

  // Si origen y destino están a la misma altura, la línea es una recta horizontal sin quiebres.
  it('arcoEnLaMismaFila_esUnaLineaRecta', () => {
    const recto = vista.arcos.find((a) => a.id === 201);
    expect(recto?.d.includes(' V ')).toBeTrue();
    const mismaFila = calcularDiagrama({
      ...diagramaEjemplo,
      actividades: [{ ...diagramaEjemplo.actividades[0], posicionY: 60 }, { ...diagramaEjemplo.actividades[1], laneId: 10, posicionY: 60 }],
      gateways: [],
      eventos: [],
      arcos: [{ id: 1, origenId: 100, destinoId: 101, poolId: 1 }],
      mensajes: []
    });
    expect(mismaFila.arcos[0].d).toMatch(/^M [\d.]+ [\d.]+ H [\d.]+$/);
  });

  // El mensaje parte del evento emisor y baja al pool destino, conservando clave de correlación y destino externo.
  it('mensaje_conEventoThrow_saleDelEventoYBajaAlPoolDestino', () => {
    expect(vista.mensajes.length).toBe(1);
    const m = vista.mensajes[0];
    expect(m.d.startsWith('M ')).toBeTrue();
    expect(m.clave).toBe('idSolicitud');
    expect(m.destinoExterno).toBe('https://banco/pagos');
  });

  // Sin eventos asociados, el mensaje se ancla al borde de los pools y cada uno obtiene una ruta distinta.
  it('mensaje_sinEventos_usaElBordeDeLosPools', () => {
    const datos: DatosDiagrama = {
      ...diagramaEjemplo,
      mensajes: [
        { ...diagramaEjemplo.mensajes[0], id: 1, eventoThrowId: undefined, sinReceptor: true },
        { ...diagramaEjemplo.mensajes[0], id: 2, eventoThrowId: undefined, eventoCatchId: 103 }
      ]
    };
    const v = calcularDiagrama(datos);
    expect(v.mensajes.length).toBe(2);
    expect(v.mensajes[0].sinReceptor).toBeTrue();
    expect(v.mensajes[0].d).not.toBe(v.mensajes[1].d);
  });

  // Datos inconsistentes (ids inexistentes) se ignoran en lugar de lanzar excepciones que romperían la pantalla.
  it('elementosConReferenciasRotas_seOmiten', () => {
    const v = calcularDiagrama({
      ...diagramaEjemplo,
      arcos: [{ id: 9, origenId: 1, destinoId: 2, poolId: 1 }],
      mensajes: [{ ...diagramaEjemplo.mensajes[0], poolDestinoId: 999 }]
    });
    expect(v.arcos.length).toBe(0);
    expect(v.mensajes.length).toBe(0);
  });

  // Casos límite: un pool sin lanes y un modelo vacío conservan alturas mínimas para que el lienzo se vea bien.
  it('poolSinLanesYModeloVacio_tienenAlturaPorDefecto', () => {
    const v = calcularDiagrama({ pools: [{ id: 1, nombre: 'P', tipoParticipante: 'EMPRESA', cajaNegra: false, orden: 0, procesoId: 1 }], lanes: [], actividades: [], gateways: [], eventos: [], arcos: [], mensajes: [] });
    expect(v.pools[0].alto).toBe(100);
    expect(calcularDiagrama({ pools: [], lanes: [], actividades: [], gateways: [], eventos: [], arcos: [], mensajes: [] }).alto).toBeGreaterThanOrEqual(160);
  });
});
