import { DatosDiagrama } from './diagrama-layout';

/**
 * Advertencias de coherencia del modelo calculadas en pantalla (HU-13, HU-16 y HU-28).
 * Reflejan las reglas que el backend valida al publicar; el backend es quien decide.
 */
export function calcularAdvertencias(d: DatosDiagrama): string[] {
  const avisos: string[] = [];
  const entrantes = new Map<number, number>();
  const salientes = new Map<number, number>();
  const sinCondicion = new Map<number, number>();
  for (const arco of d.arcos) {
    salientes.set(arco.origenId, (salientes.get(arco.origenId) ?? 0) + 1);
    entrantes.set(arco.destinoId, (entrantes.get(arco.destinoId) ?? 0) + 1);
    if (!arco.condicion?.trim()) {
      sinCondicion.set(arco.origenId, (sinCondicion.get(arco.origenId) ?? 0) + 1);
    }
  }

  for (const g of d.gateways) {
    const entra = entrantes.get(g.id) ?? 0;
    const sale = salientes.get(g.id) ?? 0;
    if (entra <= 1 && sale < 2) {
      avisos.push('El gateway "' + g.nombre + '" debe tener al menos dos salidas.');
    }
    if (g.tipoGateway !== 'PARALELO' && (sinCondicion.get(g.id) ?? 0) > 0) {
      avisos.push('Todos los arcos salientes del gateway "' + g.nombre + '" deben tener condición.');
    }
  }

  for (const a of d.actividades) {
    if (!entrantes.has(a.id) && !salientes.has(a.id)) {
      avisos.push('La actividad "' + a.nombre + '" no está conectada con ningún arco.');
    }
  }

  const lanzados = new Set(d.mensajes.map((m) => m.eventoThrowId));
  const recibidos = new Set(d.mensajes.map((m) => m.eventoCatchId));
  for (const e of d.eventos) {
    if (e.tipoEvento === 'CATCH_INICIO' && entrantes.has(e.id)) {
      avisos.push('El Message Catch de inicio "' + e.nombre + '" no puede tener arcos entrantes.');
    }
    if (e.tipoEvento === 'THROW' && !lanzados.has(e.id)) {
      avisos.push('El Message Throw "' + e.nombre + '" no tiene un mensaje asociado (envío sin recepción).');
    }
    if (e.tipoEvento !== 'THROW' && !recibidos.has(e.id)) {
      avisos.push('El Message Catch "' + e.nombre + '" no recibe ningún mensaje.');
    }
  }

  const vistos = new Set<string>();
  for (const m of d.mensajes) {
    if (m.eventoThrowId === undefined || m.eventoThrowId === null) {
      avisos.push('El mensaje "' + m.nombre + '" debe tener un Message Throw asociado.');
    }
    if (!m.eventoCatchId && !m.tipoDestinoExterno) {
      avisos.push('El mensaje "' + m.nombre + '" debe tener un Message Catch o un destino externo.');
    }
    if (!m.claveCorrelacion?.trim()) {
      avisos.push('El mensaje "' + m.nombre + '" no tiene clave de correlación.');
    } else {
      const llave = m.nombre.trim().toLowerCase() + '|' + m.claveCorrelacion.trim().toLowerCase();
      if (vistos.has(llave)) {
        avisos.push('Hay mensajes ambiguos con el mismo nombre y clave de correlación ("' + m.nombre + '").');
      }
      vistos.add(llave);
    }
    if (m.tipoDestinoExterno) {
      const destino = d.pools.find((p) => p.id === m.poolDestinoId);
      if (destino?.tipoParticipante !== 'SISTEMA_EXTERNO' || !destino.cajaNegra || !m.destinoExterno?.trim()) {
        avisos.push('El mensaje externo "' + m.nombre + '" debe apuntar a un pool SISTEMA_EXTERNO de caja negra y documentar el destino.');
      }
    }
  }
  return avisos;
}
