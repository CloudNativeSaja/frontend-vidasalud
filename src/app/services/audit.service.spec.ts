import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { AuditService, EventoAuditoria } from './audit.service';

describe('AuditService', () => {

  let servicio: AuditService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    servicio = TestBed.inject(AuditService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta los eventos por el BFF con el límite indicado', () => {
    const esperado: EventoAuditoria[] = [{
      eventId: 'a1',
      traceId: 't1',
      correlationId: 'cita-42',
      categoria: 'CITAS',
      accion: 'CITA_CONFIRMADA',
      usuario: 'paciente:123',
      ocurridoEn: '2026-11-22T15:00:00Z',
      payload: { estadoNuevo: 'CONFIRMADA' }
    }];
    let recibido: EventoAuditoria[] | undefined;

    servicio.getEvents(undefined, 50).subscribe(eventos => (recibido = eventos));

    const req = http.expectOne(r => r.url === `${environment.apiUrl}/api/bff/audit/events`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('limit')).toBe('50');
    expect(req.request.params.has('categoria')).toBe(false);
    req.flush(esperado);

    expect(recibido).toEqual(esperado);
  });

  it('envía la categoría cuando se filtra', () => {
    servicio.getEvents('CITAS').subscribe();

    const req = http.expectOne(r => r.url.endsWith('/api/bff/audit/events'));
    expect(req.request.params.get('categoria')).toBe('CITAS');
    expect(req.request.params.get('limit')).toBe('100');
    req.flush([]);
  });
});
