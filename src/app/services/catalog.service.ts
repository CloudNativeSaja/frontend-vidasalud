import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HealthService {
  id: number;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  active: boolean;
}

export interface ClinicalBox {
  id: number;
  name: string;
  centerName: string;
  active: boolean;
}

export interface Slot {
  id: number;
  boxId: number;
  boxName: string;
  serviceId: number;
  serviceName: string;
  startTime: string;
  available: boolean;
}

export interface HealthServiceRequest {
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  active: boolean;
}

export interface ClinicalBoxRequest {
  name: string;
  centerName: string;
  active: boolean;
}

export interface SlotRequest {
  boxId: number;
  serviceId: number;
  startTime: string;
  available: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {

  private apiUrl =
    `${environment.apiUrl}/api/bff/catalog`;

  constructor(
    private http: HttpClient
  ) {}

  // =========================
  // SERVICIOS
  // =========================

  getServices(): Observable<HealthService[]> {
    return this.http.get<HealthService[]>(
      `${this.apiUrl}/services`
    );
  }

  createService(
    data: HealthServiceRequest
  ): Observable<HealthService> {
    return this.http.post<HealthService>(
      `${this.apiUrl}/services`,
      data
    );
  }

  updateService(
    id: number,
    data: HealthServiceRequest
  ): Observable<HealthService> {
    return this.http.put<HealthService>(
      `${this.apiUrl}/services/${id}`,
      data
    );
  }

  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/services/${id}`
    );
  }


  // =========================
  // BOXES
  // =========================

  getBoxes(): Observable<ClinicalBox[]> {
    return this.http.get<ClinicalBox[]>(
      `${this.apiUrl}/boxes`
    );
  }

  createBox(
    data: ClinicalBoxRequest
  ): Observable<ClinicalBox> {
    return this.http.post<ClinicalBox>(
      `${this.apiUrl}/boxes`,
      data
    );
  }

  updateBox(
    id: number,
    data: ClinicalBoxRequest
  ): Observable<ClinicalBox> {
    return this.http.put<ClinicalBox>(
      `${this.apiUrl}/boxes/${id}`,
      data
    );
  }

  deleteBox(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/boxes/${id}`
    );
  }


  // =========================
  // HORARIOS
  // =========================

  getSlots(): Observable<Slot[]> {
    return this.http.get<Slot[]>(
      `${this.apiUrl}/slots`
    );
  }

  createSlot(
    data: SlotRequest
  ): Observable<Slot> {
    return this.http.post<Slot>(
      `${this.apiUrl}/slots`,
      data
    );
  }

  updateSlot(
    id: number,
    data: SlotRequest
  ): Observable<Slot> {
    return this.http.put<Slot>(
      `${this.apiUrl}/slots/${id}`,
      data
    );
  }

  deleteSlot(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/slots/${id}`
    );
  }

}