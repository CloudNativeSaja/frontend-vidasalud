import { AppointmentResponse } from './appointments.service';
import { HealthService, Slot } from './catalog.service';
import { calcularResumen } from './report.service';

function cita(id: number, status: AppointmentResponse['status'], serviceId = 1): AppointmentResponse {
  return {
    id,
    patientId: `p${id}`,
    serviceId,
    boxId: null,
    status,
    createdAt: '2026-11-01T10:00:00',
    appointmentDate: '2026-11-03T10:00:00',
    updatedAt: '2026-11-01T10:00:00'
  };
}

const servicios = [
  { id: 1, name: 'Medicina general' },
  { id: 2, name: 'Kinesiología' }
] as HealthService[];

describe('calcularResumen', () => {

  it('calcula los indicadores a partir de citas y horarios', () => {
    const citas = [
      cita(1, 'CERRADA'),
      cita(2, 'CANCELADA'),
      cita(3, 'CONFIRMADA', 2),
      cita(4, 'CONFIRMADA')
    ];
    const slots = [
      { available: false },
      { available: true },
      { available: true },
      { available: false }
    ] as Slot[];

    const r = calcularResumen(citas, slots, servicios);

    expect(r.atenciones).toBe(4);
    expect(r.tasaCancelacion).toBe(25);
    expect(r.esperaPromedioDias).toBe(2);
    expect(r.ocupacion).toBe(50);
    expect(r.porEstado.CONFIRMADA).toBe(2);
    expect(r.prestaciones[0]).toEqual({ serviceId: 1, nombre: 'Medicina general', cantidad: 3 });
  });

  it('sin datos deja los porcentajes vacíos', () => {
    const r = calcularResumen([], [], servicios);

    expect(r.atenciones).toBe(0);
    expect(r.tasaCancelacion).toBeNull();
    expect(r.ocupacion).toBeNull();
    expect(r.prestaciones).toEqual([]);
  });
});
