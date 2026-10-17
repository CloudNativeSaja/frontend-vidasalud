import { describe, expect, it } from 'vitest';
import { estadosDisponibles, esEstadoFinal } from './estados-cita';

describe('estados de una cita', () => {

  it('una cita SOLICITADA solo puede confirmarse o cancelarse', () => {
    expect(estadosDisponibles('SOLICITADA')).toEqual(['SOLICITADA', 'CONFIRMADA', 'CANCELADA']);
  });

  it('no permite saltar de SOLICITADA a EN_ESPERA', () => {
    expect(estadosDisponibles('SOLICITADA')).not.toContain('EN_ESPERA');
  });

  it('sigue el flujo completo hasta CERRADA', () => {
    expect(estadosDisponibles('CONFIRMADA')).toContain('EN_ESPERA');
    expect(estadosDisponibles('EN_ESPERA')).toContain('EN_ATENCION');
    expect(estadosDisponibles('EN_ATENCION')).toEqual(['EN_ATENCION', 'CERRADA']);
  });

  it('CERRADA y CANCELADA son finales y no ofrecen otros estados', () => {
    expect(esEstadoFinal('CERRADA')).toBe(true);
    expect(esEstadoFinal('CANCELADA')).toBe(true);
    expect(estadosDisponibles('CERRADA')).toEqual(['CERRADA']);
    expect(esEstadoFinal('SOLICITADA')).toBe(false);
  });
});
