import { AppointmentResponse } from './appointments.service';
import { HealthService, Slot } from './catalog.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ReportService, calcularResumen, desdeReporte, ResumenOperacion } from './report.service';

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
    expect(r.esperaPromedio).toBe(2);
    expect(r.esperaUnidad).toBe('días');
    expect(r.origen).toBe('local');
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

describe('desdeReporte', () => {

  it('adapta los KPIs de ms-vidasalud-report', () => {
    const r = desdeReporte(
      {
        range: 'last24h',
        totalAppointments: 10,
        byStatus: { CONFIRMADA: 4, CANCELADA: 1, DESCONOCIDO: 3 },
        cancellationRate: 0.1,
        averageWaitMinutes: 18,
        lastEventAt: '2026-11-22T10:00:00Z'
      },
      [
        { serviceId: 2, serviceName: 'Kinesiología', total: 3 },
        { serviceId: 1, serviceName: 'Medicina general', total: 7 }
      ],
      40
    );

    expect(r.origen).toBe('kafka');
    expect(r.tasaCancelacion).toBeCloseTo(10);
    expect(r.esperaPromedio).toBe(18);
    expect(r.esperaUnidad).toBe('min');
    expect(r.porEstado.CONFIRMADA).toBe(4);
    expect(r.prestaciones[0].nombre).toBe('Medicina general');
    expect(r.ocupacion).toBe(40);
  });
});

describe('ReportService.resumen', () => {

  it('si /api/bff/report falla, calcula desde las citas', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    const servicio = TestBed.inject(ReportService);
    const http = TestBed.inject(HttpTestingController);

    let resultado: ResumenOperacion | undefined;
    servicio.resumen().subscribe(r => (resultado = r));

    http.expectOne(req => req.url.endsWith('/api/bff/report/kpis'))
      .flush('no disponible', { status: 404, statusText: 'Not Found' });

    http.expectOne(req => req.url.endsWith('/api/bff/appointments')).flush([cita(1, 'CANCELADA')]);
    http.match(req => req.url.endsWith('/catalog/slots'))
      .filter(req => !req.cancelled)
      .forEach(req => req.flush([]));
    http.expectOne(req => req.url.endsWith('/catalog/services')).flush(servicios);

    expect(resultado?.origen).toBe('local');
    expect(resultado?.atenciones).toBe(1);
    expect(resultado?.tasaCancelacion).toBe(100);
  });
});
