import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  AppointmentResponse,
  AppointmentStatus,
  AppointmentsService
} from './appointments.service';
import { CatalogService, HealthService, Slot } from './catalog.service';

/**
 * Reportería VidaSalud (Kafka).
 *
 * Los KPIs NO se calculan en el core: ms-vidasalud-appointments publica cada
 * cambio de una cita en el tópico Kafka `vidasalud.appointments.events`
 * (3 particiones x 3 réplicas) y ms-vidasalud-report los consume con su
 * propio consumer group para mantener los indicadores casi en tiempo real.
 * El frontend solo los consulta a través del BFF (API Gateway + JWT).
 *
 * Si el BFF todavía no responde en /api/bff/report, `resumen()` calcula
 * los mismos indicadores a partir de las citas y del catálogo.
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

export const ORDEN_ESTADOS: AppointmentStatus[] = [
  'SOLICITADA',
  'CONFIRMADA',
  'EN_ESPERA',
  'EN_ATENCION',
  'CERRADA',
  'CANCELADA'
];

export interface PrestacionSolicitada {
  serviceId: number;
  nombre: string;
  cantidad: number;
}

export interface ResumenOperacion {
  /** De dónde salieron los datos: ms-vidasalud-report o cálculo local. */
  origen: 'kafka' | 'local';
  /** Último evento Kafka procesado (solo con origen 'kafka'). */
  ultimoEvento: string | null;
  /** Total de citas. */
  atenciones: number;
  /** Porcentaje (0-100) de citas canceladas. Null si no hay citas. */
  tasaCancelacion: number | null;
  /** Espera promedio, en la unidad indicada. */
  esperaPromedio: number | null;
  esperaUnidad: 'min' | 'días';
  /** Porcentaje (0-100) de horarios ya tomados. Null si no hay horarios. */
  ocupacion: number | null;
  porEstado: Record<AppointmentStatus, number>;
  prestaciones: PrestacionSolicitada[];
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private readonly http = inject(HttpClient);
  private readonly appointments = inject(AppointmentsService);
  private readonly catalog = inject(CatalogService);

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

  /**
   * Resumen para el panel y la página de reportes.
   * Usa ms-vidasalud-report; si no responde, calcula desde citas y catálogo.
   */
  resumen(): Observable<ResumenOperacion> {
    const ocupacion$ = this.catalog.getSlots().pipe(
      map(calcularOcupacion),
      catchError(() => of(null))
    );

    return forkJoin({
      kpis: this.getKpis(),
      top: this.getTopServices(),
      ocupacion: ocupacion$
    }).pipe(
      map(({ kpis, top, ocupacion }) => desdeReporte(kpis, top, ocupacion)),
      catchError(() => this.resumenLocal())
    );
  }

  /** Cálculo de respaldo desde las citas y el catálogo del BFF. */
  resumenLocal(): Observable<ResumenOperacion> {
    return forkJoin({
      citas: this.appointments.findAll(),
      slots: this.catalog.getSlots(),
      servicios: this.catalog.getServices()
    }).pipe(
      map(({ citas, slots, servicios }) =>
        calcularResumen(citas, slots, servicios)
      )
    );
  }
}

function estadosEnCero(): Record<AppointmentStatus, number> {
  return Object.fromEntries(
    ORDEN_ESTADOS.map(estado => [estado, 0])
  ) as Record<AppointmentStatus, number>;
}

function calcularOcupacion(slots: Slot[]): number | null {
  if (!slots.length) return null;
  return (slots.filter(slot => !slot.available).length / slots.length) * 100;
}

/** Adapta la respuesta de ms-vidasalud-report al resumen de la vista. */
export function desdeReporte(
  kpis: KpiResponse,
  top: TopServiceResponse[],
  ocupacion: number | null
): ResumenOperacion {

  const porEstado = estadosEnCero();

  for (const [estado, cantidad] of Object.entries(kpis.byStatus ?? {})) {
    if (estado in porEstado) {
      porEstado[estado as AppointmentStatus] = cantidad;
    }
  }

  // cancellationRate puede venir como fracción (0-1) o como porcentaje.
  const tasa = kpis.cancellationRate;

  return {
    origen: 'kafka',
    ultimoEvento: kpis.lastEventAt,
    atenciones: kpis.totalAppointments,
    tasaCancelacion: kpis.totalAppointments
      ? (tasa <= 1 ? tasa * 100 : tasa)
      : null,
    esperaPromedio: kpis.totalAppointments ? kpis.averageWaitMinutes : null,
    esperaUnidad: 'min',
    ocupacion,
    porEstado,
    prestaciones: [...top]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(t => ({ serviceId: t.serviceId, nombre: t.serviceName, cantidad: t.total }))
  };
}

export function calcularResumen(
  citas: AppointmentResponse[],
  slots: Slot[],
  servicios: HealthService[]
): ResumenOperacion {

  const porEstado = estadosEnCero();

  for (const cita of citas) {
    porEstado[cita.status] = (porEstado[cita.status] ?? 0) + 1;
  }

  const total = citas.length;

  const esperas = citas
    .map(cita =>
      (new Date(cita.appointmentDate).getTime() -
        new Date(cita.createdAt).getTime()) / MS_POR_DIA
    )
    .filter(dias => Number.isFinite(dias) && dias >= 0);

  const nombres = new Map(servicios.map(s => [s.id, s.name]));
  const conteo = new Map<number, number>();

  for (const cita of citas) {
    conteo.set(cita.serviceId, (conteo.get(cita.serviceId) ?? 0) + 1);
  }

  const prestaciones = [...conteo.entries()]
    .map(([serviceId, cantidad]) => ({
      serviceId,
      cantidad,
      nombre: nombres.get(serviceId) ?? `Prestación #${serviceId}`
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  return {
    origen: 'local',
    ultimoEvento: null,
    atenciones: total,
    tasaCancelacion: total ? (porEstado.CANCELADA / total) * 100 : null,
    esperaPromedio: esperas.length
      ? esperas.reduce((a, b) => a + b, 0) / esperas.length
      : null,
    esperaUnidad: 'días',
    ocupacion: calcularOcupacion(slots),
    porEstado,
    prestaciones
  };
}
