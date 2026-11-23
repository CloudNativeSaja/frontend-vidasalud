import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type CategoriaEvento = 'CITAS' | 'CATALOGO' | 'MENSAJERIA' | 'ACCESO';

/**
 * Evento de auditoría publicado por el backend.
 *
 * ms-vidasalud-audit transforma cada evento de cita de Kafka
 * (`vidasalud.appointments.events`) en un evento de auditoría
 * (`vidasalud.audit.events`) y arma esta línea de tiempo.
 */
export interface EventoAuditoria {
  eventId: string;
  /** eventId del evento de origen (trazabilidad entre servicios). */
  traceId: string;
  /** Agrupa los eventos de una misma entidad, ej. "cita-42". */
  correlationId: string;
  categoria: CategoriaEvento;
  accion: string;
  usuario: string;
  ocurridoEn: string;
  payload: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/api/bff/audit`;

  /** GET /api/bff/audit/events?categoria=CITAS&limit=100 (roles ADMIN y AUDITOR). */
  getEvents(categoria?: CategoriaEvento, limit = 100): Observable<EventoAuditoria[]> {
    let params = new HttpParams().set('limit', limit);
    if (categoria) {
      params = params.set('categoria', categoria);
    }
    return this.http.get<EventoAuditoria[]>(`${this.apiUrl}/events`, { params });
  }
}
