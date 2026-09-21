import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export type AppointmentStatus =
  | 'SOLICITADA'
  | 'CONFIRMADA'
  | 'EN_ESPERA'
  | 'EN_ATENCION'
  | 'CERRADA'
  | 'CANCELADA';

export interface AppointmentRequest {
  patientId: string;
  serviceId: number;
  boxId?: number | null;
  appointmentDate: string;
}

export interface AppointmentUpdateRequest {
  serviceId: number;
  boxId?: number | null;
  appointmentDate: string;
}

export interface StatusRequest {
  status: AppointmentStatus;
}

export interface AppointmentResponse {
  id: number;
  patientId: string;
  serviceId: number;
  boxId: number | null;
  appointmentDate: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/api/bff/appointments`;

  findAll(): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(
      this.apiUrl
    );
  }

  findById(id: number): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(
      `${this.apiUrl}/${id}`
    );
  }

  create(
    request: AppointmentRequest
  ): Observable<AppointmentResponse> {

    return this.http.post<AppointmentResponse>(
      this.apiUrl,
      request
    );
  }

  update(
    id: number,
    request: AppointmentUpdateRequest
  ): Observable<AppointmentResponse> {

    return this.http.put<AppointmentResponse>(
      `${this.apiUrl}/${id}`,
      request
    );
  }

  updateStatus(
    id: number,
    request: StatusRequest
  ): Observable<AppointmentResponse> {

    return this.http.put<AppointmentResponse>(
      `${this.apiUrl}/${id}/status`,
      request
    );
  }

  delete(id: number): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}