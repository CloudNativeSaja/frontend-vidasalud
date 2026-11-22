import { AppointmentStatus } from '../services/appointments.service';

/** Color de cada estado en gráficos. */
export const COLOR_ESTADO: Record<AppointmentStatus, string> = {
  SOLICITADA: '#C9BFAE',
  CONFIRMADA: '#C9E86F',
  EN_ESPERA: '#E8B45A',
  EN_ATENCION: '#13403A',
  CERRADA: '#5E6B66',
  CANCELADA: '#D9583B'
};

/** Nombre legible de cada estado. */
export const NOMBRE_ESTADO: Record<string, string> = {
  SOLICITADA: 'Solicitada',
  CONFIRMADA: 'Confirmada',
  EN_ESPERA: 'En espera',
  EN_ATENCION: 'En atención',
  CERRADA: 'Cerrada',
  CANCELADA: 'Cancelada'
};

/** Texto del botón que lleva a cada estado. */
export const ACCION_HACIA: Record<string, string> = {
  CONFIRMADA: 'Confirmar',
  EN_ESPERA: 'Pasar a espera',
  EN_ATENCION: 'Llamar a atención',
  CERRADA: 'Cerrar atención',
  CANCELADA: 'Cancelar'
};
