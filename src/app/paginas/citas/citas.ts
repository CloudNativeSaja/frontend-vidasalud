import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { RolesService } from '../../auth/roles.service';
import {
  AppointmentResponse,
  AppointmentStatus,
  AppointmentsService
} from '../../services/appointments.service';
import {
  CatalogService,
  ClinicalBox,
  HealthService
} from '../../services/catalog.service';
import { NOMBRE_ESTADO } from '../../shared/estados';
import { Icono } from '../../shared/icono';
import { esEstadoFinal, estadosDisponibles } from './estados-cita';

@Component({
  imports: [DatePipe, FormsModule, Icono],
  selector: 'app-citas',
  styleUrl: './citas.css',
  templateUrl: './citas.html',
})
export class Citas implements OnInit {

  private readonly appointmentsService = inject(AppointmentsService);
  private readonly catalogService = inject(CatalogService);

  protected readonly sesion = inject(RolesService);
  protected readonly nombreEstado = NOMBRE_ESTADO;

  // =========================================================
  // PERMISOS
  // =========================================================

  /** ADMIN y RECEPCIONISTA crean, editan, cambian estado y eliminan. */
  protected readonly puedeGestionar = computed(() =>
    this.sesion.tieneAlguno(['ADMIN', 'RECEPCIONISTA'])
  );

  /** El paciente solo ve y solicita sus propias citas. */
  protected readonly esPaciente = computed(() =>
    !this.puedeGestionar() && this.sesion.tiene('PACIENTE')
  );

  // =========================================================
  // DATOS Y ESTADO
  // =========================================================

  protected readonly citas = signal<AppointmentResponse[]>([]);
  protected readonly servicios = signal<HealthService[]>([]);
  protected readonly boxes = signal<ClinicalBox[]>([]);

  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly actualizando = signal(false);
  protected readonly listadoNoPermitido = signal(false);
  protected readonly error = signal('');
  protected readonly mensaje = signal('');

  protected readonly citasVisibles = computed(() => {
    const todas = [...this.citas()].sort((a, b) =>
      b.appointmentDate.localeCompare(a.appointmentDate)
    );

    if (!this.esPaciente()) return todas;

    const oid = this.sesion.oid();
    return todas.filter(cita => cita.patientId === oid);
  });

  // =========================================================
  // FORMULARIO NUEVA CITA
  // =========================================================

  mostrarFormulario = signal(false);
  pacienteId = '';
  servicioId: number | null = null;
  boxId: number | null = null;
  fecha = '';
  hora = '10:00';

  // =========================================================
  // EDICIÓN
  // =========================================================

  editandoId = signal<number | null>(null);
  editServicioId: number | null = null;
  editBoxId: number | null = null;
  editFecha = '';
  editHora = '';

  ngOnInit(): void {
    this.cargarCitas();
    this.cargarCatalogo();
  }

  estadosDisponibles(estadoActual: string): string[] {
    return estadosDisponibles(estadoActual);
  }

  esEstadoFinal(estadoActual: string): boolean {
    return esEstadoFinal(estadoActual);
  }

  nombreServicio(id: number): string {
    return this.servicios().find(s => s.id === id)?.name ?? `Prestación #${id}`;
  }

  nombreBox(id: number | null): string {
    if (id === null) return 'Sin asignar';
    return this.boxes().find(b => b.id === id)?.name ?? `Box #${id}`;
  }

  // =========================================================
  // CARGA
  // =========================================================

  cargarCitas(): void {
    this.cargando.set(true);
    this.error.set('');

    this.appointmentsService.findAll()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: data => {
          this.listadoNoPermitido.set(false);
          this.citas.set(data);
        },
        error: err => {
          if (err.status === 403 && this.esPaciente()) {
            // El BFF todavía no expone un listado filtrado por paciente.
            this.listadoNoPermitido.set(true);
            return;
          }

          this.citas.set([]);
          this.error.set('No fue posible cargar las citas desde el backend.');
        }
      });
  }

  actualizarCitas(): void {
    this.mensaje.set('');
    this.cargarCitas();
  }

  cargarCatalogo(): void {
    this.catalogService.getServices().subscribe({
      next: data => this.servicios.set(data)
    });

    this.catalogService.getBoxes().subscribe({
      next: data => this.boxes.set(data)
    });
  }

  // =========================================================
  // CREAR
  // =========================================================

  abrirFormulario(): void {
    this.mostrarFormulario.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.pacienteId = '';
    this.servicioId = null;
    this.boxId = null;
    this.fecha = '';
    this.hora = '10:00';
  }

  cerrarFormulario(): void {
    this.mostrarFormulario.set(false);
    this.error.set('');
  }

  crearCita(): void {
    this.error.set('');
    this.mensaje.set('');

    const paciente = this.esPaciente()
      ? this.sesion.oid()
      : this.pacienteId.trim();

    if (!paciente) {
      this.error.set('Debe ingresar el identificador del paciente.');
      return;
    }

    if (!this.servicioId) {
      this.error.set('Debe seleccionar una prestación.');
      return;
    }

    if (!this.fecha || !this.hora) {
      this.error.set('Debe seleccionar fecha y hora.');
      return;
    }

    const appointmentDate = `${this.fecha}T${this.hora}:00`;

    if (!this.esFechaFutura(appointmentDate)) {
      this.error.set('La fecha y hora de la cita deben ser futuras.');
      return;
    }

    this.guardando.set(true);

    this.appointmentsService.create({
      patientId: paciente,
      serviceId: this.servicioId,
      boxId: this.boxId,
      appointmentDate
    }).subscribe({
      next: cita => {
        this.guardando.set(false);
        this.mostrarFormulario.set(false);
        this.mensaje.set(`Cita #${cita.id} creada correctamente.`);

        if (this.listadoNoPermitido()) {
          this.citas.update(lista => [...lista, cita]);
        } else {
          this.cargarCitas();
        }
      },
      error: err => {
        this.guardando.set(false);
        this.error.set(
          err.status === 403
            ? 'No tienes permisos para crear citas.'
            : err.status === 400
              ? 'Los datos de la cita no son válidos.'
              : 'No fue posible crear la cita.'
        );
      }
    });
  }

  // =========================================================
  // EDITAR
  // =========================================================

  editarCita(cita: AppointmentResponse): void {
    const fecha = new Date(cita.appointmentDate);

    this.editandoId.set(cita.id);
    this.editServicioId = cita.serviceId;
    this.editBoxId = cita.boxId;
    this.editFecha = cita.appointmentDate.substring(0, 10);
    this.editHora = fecha.toTimeString().substring(0, 5);
    this.error.set('');
    this.mensaje.set('');
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.editServicioId = null;
    this.editBoxId = null;
    this.editFecha = '';
    this.editHora = '';
  }

  guardarEdicion(cita: AppointmentResponse): void {
    this.error.set('');
    this.mensaje.set('');

    if (!this.editServicioId) {
      this.error.set('Debe seleccionar una prestación.');
      return;
    }

    if (!this.editFecha || !this.editHora) {
      this.error.set('Debe seleccionar fecha y hora.');
      return;
    }

    const appointmentDate = `${this.editFecha}T${this.editHora}:00`;

    if (!this.esFechaFutura(appointmentDate)) {
      this.error.set('La fecha y hora de la cita deben ser futuras.');
      return;
    }

    this.actualizando.set(true);

    this.appointmentsService.update(cita.id, {
      serviceId: this.editServicioId,
      boxId: this.editBoxId,
      appointmentDate
    }).subscribe({
      next: actualizada => {
        this.actualizando.set(false);
        this.mensaje.set(`Cita #${actualizada.id} actualizada correctamente.`);
        this.cancelarEdicion();
        this.cargarCitas();
      },
      error: err => {
        this.actualizando.set(false);
        this.error.set(
          err.status === 403
            ? 'No tienes permisos para actualizar citas.'
            : err.status === 400
              ? 'Los datos de la cita no son válidos.'
              : 'No fue posible actualizar la cita.'
        );
      }
    });
  }

  // =========================================================
  // CAMBIAR ESTADO
  // =========================================================

  cambiarEstado(cita: AppointmentResponse, status: AppointmentStatus): void {
    this.error.set('');
    this.mensaje.set('');

    this.appointmentsService.updateStatus(cita.id, { status }).subscribe({
      next: actualizada => {
        this.mensaje.set(
          `Estado de la cita #${actualizada.id} actualizado correctamente.`
        );
        this.cargarCitas();
      },
      error: err => {
        // Se recarga la lista para que el selector vuelva al estado real.
        this.cargarCitas();

        this.error.set(
          err.status === 403
            ? 'No tienes permisos para cambiar el estado de la cita.'
            : err.status === 400
              ? 'El estado enviado no es válido.'
              : err.status === 409
                // Regla de negocio: se muestra el mensaje del servicio de citas.
                ? err.error?.message ?? 'El cambio de estado no está permitido.'
                : 'No fue posible cambiar el estado de la cita.'
        );
      }
    });
  }

  // =========================================================
  // ELIMINAR
  // =========================================================

  eliminarCita(cita: AppointmentResponse): void {
    if (!window.confirm(`¿Está seguro de eliminar la cita #${cita.id}?`)) {
      return;
    }

    this.error.set('');
    this.mensaje.set('');

    this.appointmentsService.delete(cita.id).subscribe({
      next: () => {
        this.mensaje.set(`Cita #${cita.id} eliminada correctamente.`);
        this.cargarCitas();
      },
      error: err => {
        this.error.set(
          err.status === 403
            ? 'No tienes permisos para eliminar citas.'
            : err.status === 404
              ? 'La cita no existe.'
              : 'No fue posible eliminar la cita.'
        );
      }
    });
  }

  private esFechaFutura(valor: string): boolean {
    const fecha = new Date(valor);
    return !isNaN(fecha.getTime()) && fecha > new Date();
  }
}
