import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { RolesService } from '../../auth/roles.service';
import { esEstadoFinal } from '../../paginas/citas/estados-cita';
import {
  AppointmentResponse,
  AppointmentsService
} from '../../services/appointments.service';
import {
  CatalogService,
  HealthService,
  Slot
} from '../../services/catalog.service';
import { NOMBRE_ESTADO } from '../../shared/estados';
import { aFechaCita, diaLocal, saludo } from '../../shared/fechas';
import { Icono } from '../../shared/icono';

const PASOS = [
  { estado: 'SOLICITADA', etiqueta: 'Solicitada' },
  { estado: 'CONFIRMADA', etiqueta: 'Confirmada' },
  { estado: 'EN_ESPERA', etiqueta: 'En espera' },
  { estado: 'EN_ATENCION', etiqueta: 'En atención' },
  { estado: 'CERRADA', etiqueta: 'Alta' }
];

/** Panel del paciente: próxima cita, solicitud y historial. */
@Component({
  selector: 'app-dashboard-paciente',
  imports: [DatePipe, Icono],
  templateUrl: './dashboard-paciente.html',
  styleUrl: './dashboard-paciente.css'
})
export class DashboardPaciente implements OnInit {

  private readonly appointments = inject(AppointmentsService);
  private readonly catalog = inject(CatalogService);

  protected readonly sesion = inject(RolesService);
  protected readonly saludo = saludo();
  protected readonly pasos = PASOS;
  protected readonly nombreEstado = NOMBRE_ESTADO;

  protected readonly servicios = signal<HealthService[]>([]);
  protected readonly slots = signal<Slot[]>([]);
  protected readonly misCitas = signal<AppointmentResponse[]>([]);

  /** El BFF todavía no permite al paciente listar sus citas. */
  protected readonly historialDisponible = signal(true);
  protected readonly cargandoCatalogo = signal(true);
  protected readonly enviando = signal(false);
  protected readonly error = signal('');
  protected readonly mensaje = signal('');

  protected readonly servicioId = signal<number | null>(null);
  protected readonly dia = signal('');
  protected readonly slotId = signal<number | null>(null);

  protected readonly diasDisponibles = computed(() => {
    const id = this.servicioId();
    if (id === null) return [];

    const dias = this.slotsLibres()
      .filter(slot => slot.serviceId === id)
      .map(slot => diaLocal(slot.startTime));

    return [...new Set(dias)].sort().slice(0, 14);
  });

  protected readonly horasDelDia = computed(() =>
    this.slotsLibres()
      .filter(slot =>
        slot.serviceId === this.servicioId() &&
        diaLocal(slot.startTime) === this.dia()
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  );

  protected readonly proximaCita = computed(() =>
    [...this.misCitas()]
      .filter(cita => !esEstadoFinal(cita.status))
      .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))[0] ?? null
  );

  protected readonly historial = computed(() =>
    [...this.misCitas()].sort((a, b) =>
      b.appointmentDate.localeCompare(a.appointmentDate)
    )
  );

  private readonly slotsLibres = computed(() => {
    const ahora = Date.now();
    return this.slots().filter(
      slot => slot.available && new Date(slot.startTime).getTime() > ahora
    );
  });

  ngOnInit(): void {
    this.catalog.getServices().subscribe({
      next: lista => this.servicios.set(lista.filter(s => s.active)),
      error: () => this.error.set('No fue posible cargar las prestaciones.')
    });

    this.catalog.getSlots().subscribe({
      next: lista => {
        this.slots.set(lista);
        this.cargandoCatalogo.set(false);
      },
      error: () => {
        this.cargandoCatalogo.set(false);
        this.error.set('No fue posible cargar los horarios disponibles.');
      }
    });

    this.cargarMisCitas();
  }

  private cargarMisCitas(): void {
    const oid = this.sesion.oid();

    this.appointments.findAll().subscribe({
      next: citas => {
        this.historialDisponible.set(true);
        this.misCitas.set(citas.filter(cita => cita.patientId === oid));
      },
      error: () => this.historialDisponible.set(false)
    });
  }

  nombreServicio(id: number): string {
    return this.servicios().find(s => s.id === id)?.name ?? `Prestación #${id}`;
  }

  pasoActual(estado: string): number {
    return PASOS.findIndex(paso => paso.estado === estado);
  }

  elegirServicio(valor: string): void {
    this.servicioId.set(valor ? Number(valor) : null);
    this.dia.set('');
    this.slotId.set(null);
  }

  elegirDia(dia: string): void {
    this.dia.set(dia);
    this.slotId.set(null);
  }

  solicitar(): void {
    const slot = this.slots().find(s => s.id === this.slotId());
    const servicioId = this.servicioId();
    const oid = this.sesion.oid();

    if (!slot || servicioId === null || !oid) {
      this.error.set('Elige una prestación, un día y una hora.');
      return;
    }

    this.enviando.set(true);
    this.error.set('');
    this.mensaje.set('');

    this.appointments.create({
      patientId: oid,
      serviceId: servicioId,
      boxId: slot.boxId,
      appointmentDate: aFechaCita(slot.startTime)
    }).subscribe({
      next: cita => {
        this.misCitas.update(lista => [...lista, cita]);
        this.slots.update(lista =>
          lista.map(s => (s.id === slot.id ? { ...s, available: false } : s))
        );
        this.mensaje.set('Tu solicitud quedó registrada. Te avisaremos cuando sea confirmada.');
        this.servicioId.set(null);
        this.dia.set('');
        this.slotId.set(null);
        this.enviando.set(false);

        this.catalog.reserveSlot(slot.id).subscribe({ error: () => undefined });
      },
      error: err => {
        this.enviando.set(false);
        this.error.set(
          err.status === 409 || err.status === 400
            ? err.error?.message ?? 'Ese horario ya no está disponible.'
            : 'No fue posible registrar la solicitud.'
        );
      }
    });
  }
}
