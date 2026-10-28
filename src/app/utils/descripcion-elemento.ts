import {
  POLITICAS_FALLO,
  POLITICAS_SIN_CASO,
  TIPOS_ACTIVIDAD,
  TIPOS_DESTINO_EXTERNO,
  TIPOS_EVENTO_MENSAJE,
  TIPOS_GATEWAY,
  TIPOS_PARTICIPANTE,
  OpcionLista
} from '../models/enums.model';
import { SeleccionDiagrama } from '../models/seleccion-diagrama.model';
import { DatosDiagrama } from './diagrama-layout';

export interface FilaDescripcion {
  etiqueta: string;
  valor: string;
}

export interface DescripcionElemento {
  titulo: string;
  tipo: string;
  filas: FilaDescripcion[];
}

function etiquetaDe(opciones: OpcionLista[], valor: string | undefined): string {
  if (!valor) {
    return '—';
  }
  return opciones.find((o) => o.valor === valor)?.etiqueta ?? valor;
}

function texto(valor: string | number | undefined | null): string {
  return valor === undefined || valor === null || valor === '' ? '—' : String(valor);
}

/** Nombre de un nodo (actividad, gateway o evento) por su id. */
export function nombreDeNodo(datos: DatosDiagrama, id: number | undefined): string {
  if (!id) {
    return '—';
  }
  const nodo = [...datos.actividades, ...datos.gateways, ...datos.eventos].find((n) => n.id === id);
  return nodo ? nodo.nombre : '#' + id;
}

function nombreDeLane(datos: DatosDiagrama, id: number): string {
  const lane = datos.lanes.find((l) => l.id === id);
  return lane ? lane.rolProcesoNombre + ' (' + lane.nombre + ')' : '#' + id;
}

function nombreDePool(datos: DatosDiagrama, id: number): string {
  return datos.pools.find((p) => p.id === id)?.nombre ?? '#' + id;
}

/** Texto descriptivo del elemento elegido en el diagrama (para el panel de detalle). */
function describir(datos: DatosDiagrama, sel: SeleccionDiagrama): DescripcionElemento | undefined {
  switch (sel.tipo) {
    case 'pool': {
      const p = datos.pools.find((x) => x.id === sel.id);
      return p && {
        titulo: p.nombre, tipo: 'Pool',
        filas: [
          { etiqueta: 'Participante', valor: etiquetaDe(TIPOS_PARTICIPANTE, p.tipoParticipante) },
          { etiqueta: 'Caja negra', valor: p.cajaNegra ? 'Sí' : 'No' },
          { etiqueta: 'Lanes', valor: String(datos.lanes.filter((l) => l.poolId === p.id).length) }
        ]
      };
    }
    case 'lane': {
      const l = datos.lanes.find((x) => x.id === sel.id);
      return l && {
        titulo: l.nombre, tipo: 'Lane',
        filas: [
          { etiqueta: 'Rol de proceso (responsable)', valor: l.rolProcesoNombre },
          { etiqueta: 'Pool', valor: nombreDePool(datos, l.poolId) },
          { etiqueta: 'Orden', valor: String(l.orden) }
        ]
      };
    }
    case 'actividad': {
      const a = datos.actividades.find((x) => x.id === sel.id);
      return a && {
        titulo: a.nombre, tipo: 'Actividad',
        filas: [
          { etiqueta: 'Tipo', valor: etiquetaDe(TIPOS_ACTIVIDAD, a.tipoActividad) },
          { etiqueta: 'Lane (responsable)', valor: nombreDeLane(datos, a.laneId) },
          { etiqueta: 'Descripción', valor: texto(a.descripcion) },
          { etiqueta: 'Posición', valor: a.posicionX + ', ' + a.posicionY }
        ]
      };
    }
    case 'gateway': {
      const g = datos.gateways.find((x) => x.id === sel.id);
      return g && {
        titulo: g.nombre, tipo: 'Gateway',
        filas: [
          { etiqueta: 'Tipo', valor: etiquetaDe(TIPOS_GATEWAY, g.tipoGateway) },
          { etiqueta: 'Lane', valor: nombreDeLane(datos, g.laneId) },
          { etiqueta: 'Posición', valor: g.posicionX + ', ' + g.posicionY }
        ]
      };
    }
    case 'evento': {
      const e = datos.eventos.find((x) => x.id === sel.id);
      return e && {
        titulo: e.nombre, tipo: 'Evento de mensaje',
        filas: [
          { etiqueta: 'Tipo', valor: etiquetaDe(TIPOS_EVENTO_MENSAJE, e.tipoEvento) },
          { etiqueta: 'Contenido del mensaje', valor: texto(e.contenido) },
          { etiqueta: 'Clave de correlación', valor: texto(e.claveCorrelacion) },
          { etiqueta: 'Origen externo', valor: e.origenExterno ? 'Sí' : 'No' },
          { etiqueta: 'Lane', valor: nombreDeLane(datos, e.laneId) }
        ]
      };
    }
    case 'arco': {
      const a = datos.arcos.find((x) => x.id === sel.id);
      return a && {
        titulo: a.etiqueta || 'Arco', tipo: 'Arco',
        filas: [
          { etiqueta: 'Origen', valor: nombreDeNodo(datos, a.origenId) },
          { etiqueta: 'Destino', valor: nombreDeNodo(datos, a.destinoId) },
          { etiqueta: 'Condición', valor: texto(a.condicion) }
        ]
      };
    }
    case 'mensaje': {
      const m = datos.mensajes.find((x) => x.id === sel.id);
      return m && {
        titulo: m.nombre, tipo: 'Mensaje entre pools',
        filas: [
          { etiqueta: 'Contenido', valor: texto(m.contenido) },
          { etiqueta: 'Pool de origen', valor: nombreDePool(datos, m.poolOrigenId) },
          { etiqueta: 'Pool de destino', valor: nombreDePool(datos, m.poolDestinoId) },
          { etiqueta: 'Message Throw', valor: nombreDeNodo(datos, m.eventoThrowId) },
          { etiqueta: 'Message Catch', valor: nombreDeNodo(datos, m.eventoCatchId) },
          { etiqueta: 'Clave de correlación', valor: texto(m.claveCorrelacion) },
          { etiqueta: 'Destino externo', valor: m.tipoDestinoExterno ? etiquetaDe(TIPOS_DESTINO_EXTERNO, m.tipoDestinoExterno) + ': ' + texto(m.destinoExterno) : '—' },
          { etiqueta: 'Si falla la notificación', valor: etiquetaDe(POLITICAS_FALLO, m.politicaFalloNotificacion) },
          { etiqueta: 'Actividad de error', valor: nombreDeNodo(datos, m.actividadErrorId) },
          { etiqueta: 'Si no hay caso', valor: etiquetaDe(POLITICAS_SIN_CASO, m.politicaSinCaso) },
          { etiqueta: 'Sin receptor', valor: m.sinReceptor ? 'Sí' : 'No' }
        ]
      };
    }
  }
}


export function describirElemento(datos: DatosDiagrama, sel: SeleccionDiagrama | null): DescripcionElemento | null {
  return sel ? (describir(datos, sel) ?? null) : null;
}
