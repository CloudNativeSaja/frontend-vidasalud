import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

/**
 * Reportería VidaSalud (Kafka).
 *
 * Los KPIs NO se calculan en el core: ms-vidasalud-appointments publica cada
 * cambio de una cita en el tópico Kafka `vidasalud.appointments.events`
 * (3 particiones x 3 réplicas) y ms-vidasalud-report los consume con su
 * propio consumer group para mantener los indicadores casi en tiempo real.
 * El frontend solo los consulta a través del BFF (API Gateway + JWT).
 */

/** Rangos de tiempo que acepta ms-vidasalud-report. */
export type ReportRange = 'last24h' | 'last7d' | 'last30d';

/** Indicadores agregados a partir de los eventos de citas. */
export interface KpiResponse {
  range: ReportRange;
  totalAppointments: number;
  byStatus: Record<string, number>;
  cancellationRate: number;
  averageWaitMinutes: number;
  /** Timestamp del último evento Kafka procesado (frescura del dato). */
  lastEventAt: string | null;
}

/** Prestación más solicitada en el rango. */
export interface TopServiceResponse {
  serviceId: number;
  serviceName: string;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/api/bff/report`;

  /** GET /api/bff/report/kpis?range=last24h */
  getKpis(range: ReportRange = 'last24h'): Observable<KpiResponse> {
    return this.http.get<KpiResponse>(
      `${this.apiUrl}/kpis`,
      { params: new HttpParams().set('range', range) }
    );
  }

  /** GET /api/bff/report/top-services?range=last7d */
  getTopServices(range: ReportRange = 'last7d'): Observable<TopServiceResponse[]> {
    return this.http.get<TopServiceResponse[]>(
      `${this.apiUrl}/top-services`,
      { params: new HttpParams().set('range', range) }
    );
  }
}
