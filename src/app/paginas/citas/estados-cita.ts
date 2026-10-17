/**
 * Transiciones de estado de una cita.
 * Deben coincidir con las que valida ms-vidasalud-appointments
 * (AppointmentService.validateStatusTransition).
 */
export const TRANSICIONES_PERMITIDAS: Record<string, string[]> = {
  SOLICITADA: ['CONFIRMADA', 'CANCELADA'],
  CONFIRMADA: ['EN_ESPERA', 'CANCELADA'],
  EN_ESPERA: ['EN_ATENCION', 'CANCELADA'],
  EN_ATENCION: ['CERRADA'],
  CERRADA: [],
  CANCELADA: []
};

export const ETIQUETAS_ESTADO: Record<string, string> = {
  SOLICITADA: 'SOLICITADA',
  CONFIRMADA: 'CONFIRMADA',
  EN_ESPERA: 'EN ESPERA',
  EN_ATENCION: 'EN ATENCIÓN',
  CERRADA: 'CERRADA',
  CANCELADA: 'CANCELADA'
};

/** Estado actual más los estados a los que la cita puede pasar. */
export function estadosDisponibles(estadoActual: string): string[] {
  return [estadoActual, ...(TRANSICIONES_PERMITIDAS[estadoActual] ?? [])];
}

/** CERRADA y CANCELADA son estados finales. */
export function esEstadoFinal(estadoActual: string): boolean {
  return (TRANSICIONES_PERMITIDAS[estadoActual] ?? []).length === 0;
}
