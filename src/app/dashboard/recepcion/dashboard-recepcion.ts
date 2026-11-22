import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RolesService } from '../../auth/roles.service';
import { TRANSICIONES_PERMITIDAS } from '../../paginas/citas/estados-cita';
import {
  AppointmentResponse,
  AppointmentStatus,
  AppointmentsService
} from '../../services/appointments.service';
import { CatalogService } from '../../services/catalog.service';
import { ACCION_HACIA, NOMBRE_ESTADO } from '../../shared/estados';
import { esHoy, saludo } from '../../shared/fechas';
import { Icono } from '../../shared/icono';

const COLUMNAS: AppointmentStatus[] = [
  'SOLICITADA',
  'CONFIRMADA',
  'EN_ESPERA',
  'EN_ATENCION'
];

/** Panel de recepción: cola del día y tablero por estado. */
@Component({
  selector: 'app-dashboard-recepcion',
  imports: [DatePipe, RouterLink, Icono],
  templateUrl: './dashboard-recepcion.html',
  styleUrl: './dashboard-recepcion.css'
})
export class DashboardRecepcion implements OnInit {

  private readonly appointments = inject(AppointmentsService);
  private readonly catalog = inject(CatalogService);

  protected readonly sesion = inject(RolesService);
  protected readonly saludo = saludo();
  protected readonly hoy = new Date();
  protected readonly nombreEstado = NOMBRE_ESTADO;
  protected readonly accionHacia = ACCION_HACIA;

  protected readonly citas = signal<AppointmentResponse[]>([]);
  protected readonly servicios = signal(new Map<number, string>());
  protected readonly boxes = signal(new Map<number, string>());

  protected readonly cargando = signal(true);
  protected readonly procesando = signal<number | null>(null);
  protected readonly soloHoy = signal(true);
  protected readonly error = signal('');
  protected readonly mensaje = signal('');

  protected readonly visibles = computed(() =>
    this.citas()
      .filter(cita => !this.soloHoy() || esHoy(cita.appointmentDate))
      .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))
  );

  protected readonly columnas = computed(() =>
    COLUMNAS.map(estado => ({
      estado,
      citas: this.visibles().filter(cita => cita.status === estado)
    }))
  );

  /** Primero quien ya espera; si no hay, la próxima confirmada. */
  protected readonly siguienteLlamado = computed(() =>
    this.visibles().find(cita => cita.status === 'EN_ESPERA') ??
    this.visibles().find(cita => cita.status === 'CONFIRMADA') ??
    null
  );

  ngOnInit(): void {
    this.cargar();

    this.catalog.getServices().subscribe({
      next: lista => this.servicios.set(new Map(lista.map(s => [s.id, s.name])))
    });

    this.catalog.getBoxes().subscribe({
      next: lista => this.boxes.set(new Map(lista.map(b => [b.id, b.name])))
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');

    this.appointments.findAll().subscribe({
      next: citas => {
        this.citas.set(citas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar la cola de atención.');
        this.cargando.set(false);
      }
    });
  }

  /** Siguiente estado del flujo normal (sin contar la cancelación). */
  siguienteEstado(estado: string): AppointmentStatus | null {
    const siguiente = (TRANSICIONES_PERMITIDAS[estado] ?? [])
      .find(destino => destino !== 'CANCELADA');

    return (siguiente as AppointmentStatus | undefined) ?? null;
  }

  nombreServicio(id: number): string {
    return this.servicios().get(id) ?? `Prestación #${id}`;
  }

  nombreBox(id: number | null): string {
    if (id === null) return 'Sin box';
    return this.boxes().get(id) ?? `Box #${id}`;
  }

  avanzar(cita: AppointmentResponse): void {
    const destino = this.siguienteEstado(cita.status);
    if (!destino) return;

    this.procesando.set(cita.id);
    this.error.set('');
    this.mensaje.set('');

    this.appointments.updateStatus(cita.id, { status: destino }).subscribe({
      next: actualizada => {
        this.citas.update(lista =>
          lista.map(c => (c.id === actualizada.id ? actualizada : c))
        );
        this.mensaje.set(
          `Cita #${actualizada.id} ahora está ${NOMBRE_ESTADO[actualizada.status].toLowerCase()}.`
        );
        this.procesando.set(null);
      },
      error: err => {
        this.procesando.set(null);
        this.error.set(
          err.status === 409
            ? err.error?.message ?? 'El cambio de estado no está permitido.'
            : err.status === 403
              ? 'No tienes permisos para cambiar el estado de la cita.'
              : 'No fue posible cambiar el estado de la cita.'
        );
        this.cargar();
      }
    });
  }
}
