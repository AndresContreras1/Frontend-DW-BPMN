import { ProcesoResponse } from '../models/proceso.model';

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
