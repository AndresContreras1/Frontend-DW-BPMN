import { ProcesoDiagramaResponse, ProcesoResponse } from '../models/proceso.model';

export const procesoBase: ProcesoResponse = {
  id: 7,
  nombre: 'Vacaciones',
  descripcion: 'Solicitud de vacaciones',
  categoria: 'RRHH',
  estado: 'BORRADOR',
  activo: true,
  fechaCreacion: '2026-01-01T10:00:00',
  fechaModificacion: '2026-01-02T10:00:00'
};

/** Modelo de ejemplo: un pool de empresa con dos lanes, un gateway, un evento y un pool externo de caja negra. */
export const diagramaEjemplo: ProcesoDiagramaResponse = {
  proceso: procesoBase,
  pools: [
    { id: 1, nombre: 'Empresa Demo', tipoParticipante: 'EMPRESA', cajaNegra: false, orden: 0, procesoId: 7 },
    { id: 2, nombre: 'Banco', tipoParticipante: 'SISTEMA_EXTERNO', cajaNegra: true, orden: 1, procesoId: 7 }
  ],
  lanes: [
    { id: 10, nombre: 'Empleado', orden: 0, poolId: 1, rolProcesoId: 1, rolProcesoNombre: 'Empleado' },
    { id: 11, nombre: 'Jefe', orden: 1, poolId: 1, rolProcesoId: 2, rolProcesoNombre: 'Jefe directo' }
  ],
  actividades: [
    { id: 100, nombre: 'Radicar solicitud de vacaciones', posicionX: 80, posicionY: 60, laneId: 10, tipoActividad: 'TAREA' },
    { id: 101, nombre: 'Revisar solicitud', posicionX: 240, posicionY: 60, laneId: 11, tipoActividad: 'USUARIO', descripcion: 'El jefe revisa' }
  ],
  gateways: [{ id: 102, nombre: 'Aprobada', posicionX: 400, posicionY: 60, laneId: 11, tipoGateway: 'EXCLUSIVO' }],
  eventos: [
    { id: 103, nombre: 'NotificarPago', tipoEvento: 'THROW', contenido: 'Pago', claveCorrelacion: 'idSolicitud', posicionX: 560, posicionY: 60, laneId: 11, origenExterno: false }
  ],
  arcos: [
    { id: 200, origenId: 100, destinoId: 101, poolId: 1 },
    { id: 201, origenId: 101, destinoId: 102, poolId: 1, etiqueta: 'Revisada' },
    { id: 202, origenId: 102, destinoId: 103, poolId: 1, etiqueta: 'Sí', condicion: 'aprobada == true' },
    { id: 203, origenId: 102, destinoId: 100, poolId: 1, etiqueta: 'No', condicion: 'aprobada == false' }
  ],
  mensajes: [
    {
      id: 300, nombre: 'Orden de pago', contenido: 'Pagar', poolOrigenId: 1, poolDestinoId: 2, procesoId: 7,
      eventoThrowId: 103, claveCorrelacion: 'idSolicitud', tipoDestinoExterno: 'SERVICIO_WEB', destinoExterno: 'https://banco/pagos',
      politicaFalloNotificacion: 'CONTINUAR_FLUJO', politicaSinCaso: 'DESCARTAR', sinReceptor: false
    }
  ]
};
