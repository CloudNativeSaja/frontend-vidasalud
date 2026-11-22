import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

import {
  AppointmentResponse,
  AppointmentStatus,
  AppointmentsService
} from './appointments.service';
import { CatalogService, HealthService, Slot } from './catalog.service';

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
  /** Total de citas registradas. */
  atenciones: number;
  /** Porcentaje (0-100) de citas canceladas. Null si no hay citas. */
  tasaCancelacion: number | null;
  /** Días promedio entre la solicitud y la fecha de la cita. */
  esperaPromedioDias: number | null;
  /** Porcentaje (0-100) de horarios ya tomados. Null si no hay horarios. */
  ocupacion: number | null;
  porEstado: Record<AppointmentStatus, number>;
  prestaciones: PrestacionSolicitada[];
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Indicadores de operación calculados a partir de las citas
 * y del catálogo que entrega el BFF.
 */
@Injectable({ providedIn: 'root' })
export class ReportService {

  private readonly appointments = inject(AppointmentsService);
  private readonly catalog = inject(CatalogService);

  resumen(): Observable<ResumenOperacion> {
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

export function calcularResumen(
  citas: AppointmentResponse[],
  slots: Slot[],
  servicios: HealthService[]
): ResumenOperacion {

  const porEstado = Object.fromEntries(
    ORDEN_ESTADOS.map(estado => [estado, 0])
  ) as Record<AppointmentStatus, number>;

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

  const tomados = slots.filter(slot => !slot.available).length;

  return {
    atenciones: total,
    tasaCancelacion: total ? (porEstado.CANCELADA / total) * 100 : null,
    esperaPromedioDias: esperas.length
      ? esperas.reduce((a, b) => a + b, 0) / esperas.length
      : null,
    ocupacion: slots.length ? (tomados / slots.length) * 100 : null,
    porEstado,
    prestaciones
  };
}
