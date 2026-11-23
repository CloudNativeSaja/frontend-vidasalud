import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { proveerSesion } from '../../../testing/sesion-de-prueba';
import { EventoAuditoria } from '../../services/audit.service';
import { Auditoria } from './auditoria';

const eventos: EventoAuditoria[] = [
  {
    eventId: 'a1',
    traceId: 't1',
    correlationId: 'cita-42',
    categoria: 'CITAS',
    accion: 'CITA_CONFIRMADA',
    usuario: 'paciente:123',
    ocurridoEn: '2026-11-22T15:00:00Z',
    payload: { estadoNuevo: 'CONFIRMADA' }
  },
  {
    eventId: 'a2',
    traceId: 't2',
    correlationId: 'cat-1',
    categoria: 'CATALOGO',
    accion: 'SERVICIO_EDITADO',
    usuario: 'admin',
    ocurridoEn: '2026-11-22T15:05:00Z',
    payload: {}
  }
];

describe('Auditoria', () => {

  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Auditoria],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...proveerSesion(['AUDITOR'])
      ]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
  });

  function crear() {
    const fixture = TestBed.createComponent(Auditoria);
    fixture.detectChanges();
    return fixture;
  }

  it('carga los eventos al iniciar y los muestra en la línea de tiempo', async () => {
    const fixture = crear();

    http.expectOne(r => r.url.endsWith('/api/bff/audit/events')).flush(eventos);
    await fixture.whenStable();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('CITA_CONFIRMADA');
    expect(texto).toContain('SERVICIO_EDITADO');
    expect(texto).toContain('2 eventos');
  });

  it('el filtro por categoría muestra solo esos eventos', async () => {
    const fixture = crear();
    http.expectOne(r => r.url.endsWith('/api/bff/audit/events')).flush(eventos);
    await fixture.whenStable();

    fixture.componentInstance['filtro'].set('CITAS');
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('CITA_CONFIRMADA');
    expect(texto).not.toContain('SERVICIO_EDITADO');
    expect(texto).toContain('1 eventos');
  });

  it('si el backend falla muestra el error con la opción de reintentar', async () => {
    const fixture = crear();

    http.expectOne(r => r.url.endsWith('/api/bff/audit/events'))
      .flush('error', { status: 503, statusText: 'Service Unavailable' });
    await fixture.whenStable();
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No fue posible cargar la auditoría');
    expect(texto).toContain('Reintentar');
  });

  it('sin eventos muestra el estado vacío', async () => {
    const fixture = crear();

    http.expectOne(r => r.url.endsWith('/api/bff/audit/events')).flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin eventos para');
  });
});
