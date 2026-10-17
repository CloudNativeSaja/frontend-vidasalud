import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MsalService } from '@azure/msal-angular';
import { finalize } from 'rxjs';

import {
  AppointmentsService,
  AppointmentResponse
} from '../../services/appointments.service';

import { CatalogService } from '../../services/catalog.service';


@Component({
  imports: [
    DatePipe,
    FormsModule
  ],

  selector: 'app-citas',

  styleUrl: './citas.css',

  templateUrl: './citas.html',
})


export class Citas implements OnInit {


  // =========================================================
  // DATOS
  // =========================================================

  citas: AppointmentResponse[] = [];

  servicios: any[] = [];

  boxes: any[] = [];


  // =========================================================
  // ESTADOS
  // =========================================================

  cargando = false;

  guardando = false;

  actualizando = false;

  error = '';

  mensaje = '';


  // =========================================================
  // FORMULARIO NUEVA CITA
  // =========================================================

  mostrarFormulario = false;

  pacienteId = '';

  servicioId: number | null = null;

  boxId: number | null = null;

  fecha = '';

  hora = '10:00';


  // =========================================================
  // EDICIÓN
  // =========================================================

  editandoId: number | null = null;

  editServicioId: number | null = null;

  editBoxId: number | null = null;

  editFecha = '';

  editHora = '';


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private appointmentsService: AppointmentsService,
    private catalogService: CatalogService,
    private msalService: MsalService,
    private cdr: ChangeDetectorRef
  ) {}


  // =========================================================
  // INICIO
  // =========================================================

  ngOnInit(): void {

    const accounts =
      this.msalService.instance.getAllAccounts();

    console.log(
      'CUENTAS MSAL:',
      accounts
    );

    console.log(
      'CUENTA ACTIVA:',
      this.msalService.instance.getActiveAccount()
    );

    this.cargarCitas();

    this.cargarCatalogo();
  }


  // =========================================================
  // CARGAR CITAS
  // =========================================================

  cargarCitas(): void {

    console.log('>>> CARGANDO CITAS');

    this.cargando = true;

    this.error = '';

    this.cdr.detectChanges();


    this.appointmentsService.findAll()

      .pipe(

        finalize(() => {

          console.log(
            '>>> FINALIZÓ CARGA DE CITAS'
          );

          this.cargando = false;

          this.cdr.detectChanges();

        })

      )

      .subscribe({

        next: (data) => {

          console.log(
            '>>> CITAS RECIBIDAS:',
            data
          );

          this.citas = [...data];

          console.log(
            '>>> CANTIDAD CITAS:',
            this.citas.length
          );

        },


        error: (err) => {

          console.error(
            '>>> ERROR CARGANDO CITAS:',
            err
          );

          this.citas = [];

          this.error =
            'No fue posible cargar las citas desde el backend.';

        }

      });

  }


  // =========================================================
  // BOTÓN ACTUALIZAR
  // =========================================================

  actualizarCitas(): void {

    console.log(
      '>>> BOTÓN ACTUALIZAR PRESIONADO'
    );

    this.mensaje = '';

    this.error = '';

    this.cargarCitas();

  }


  // =========================================================
  // CARGAR CATÁLOGO
  // =========================================================

  cargarCatalogo(): void {


    // -------------------------------------------------------
    // SERVICIOS
    // -------------------------------------------------------

    this.catalogService.getServices()

      .subscribe({

        next: (data) => {

          console.log(
            'SERVICIOS:',
            data
          );

          this.servicios = data;

          this.cdr.detectChanges();

        },

        error: (err) => {

          console.error(
            'Error cargando servicios:',
            err
          );

        }

      });


    // -------------------------------------------------------
    // BOXES
    // -------------------------------------------------------

    this.catalogService.getBoxes()

      .subscribe({

        next: (data) => {

          console.log(
            'BOXES:',
            data
          );

          this.boxes = data;

          this.cdr.detectChanges();

        },

        error: (err) => {

          console.error(
            'Error cargando boxes:',
            err
          );

        }

      });

  }


  // =========================================================
  // ABRIR FORMULARIO
  // =========================================================

  abrirFormulario(): void {

    this.mostrarFormulario = true;

    this.error = '';

    this.mensaje = '';

    this.pacienteId = '';

    this.servicioId = null;

    this.boxId = null;

    this.fecha = '';

    this.hora = '10:00';

    this.cdr.detectChanges();

  }


  // =========================================================
  // CERRAR FORMULARIO
  // =========================================================

  cerrarFormulario(): void {

    this.mostrarFormulario = false;

    this.error = '';

    this.mensaje = '';

  }


  // =========================================================
  // CREAR CITA
  // =========================================================

  crearCita(): void {

    this.error = '';

    this.mensaje = '';


    // -------------------------------------------------------
    // PACIENTE
    // -------------------------------------------------------

    if (!this.pacienteId.trim()) {

      this.error =
        'Debe ingresar el identificador del paciente.';

      return;

    }


    // -------------------------------------------------------
    // SERVICIO
    // -------------------------------------------------------

    if (!this.servicioId) {

      this.error =
        'Debe seleccionar una prestación.';

      return;

    }


    // -------------------------------------------------------
    // FECHA
    // -------------------------------------------------------

    if (!this.fecha) {

      this.error =
        'Debe seleccionar una fecha.';

      return;

    }


    // -------------------------------------------------------
    // HORA
    // -------------------------------------------------------

    if (!this.hora) {

      this.error =
        'Debe seleccionar una hora.';

      return;

    }


    const appointmentDate =
      `${this.fecha}T${this.hora}:00`;


    const fechaSeleccionada =
      new Date(appointmentDate);


    // -------------------------------------------------------
    // FECHA FUTURA
    // -------------------------------------------------------

    if (
      isNaN(fechaSeleccionada.getTime()) ||
      fechaSeleccionada <= new Date()
    ) {

      this.error =
        'La fecha y hora de la cita deben ser futuras.';

      return;

    }


    // -------------------------------------------------------
    // CREAR
    // -------------------------------------------------------

    this.guardando = true;


    this.appointmentsService.create({

      patientId:
        this.pacienteId.trim(),

      serviceId:
        this.servicioId,

      boxId:
        this.boxId,

      appointmentDate

    })

    .subscribe({

      next: (cita) => {

        console.log(
          '>>> CITA CREADA:',
          cita
        );

        this.guardando = false;

        this.mensaje =
          `Cita #${cita.id} creada correctamente.`;

        this.mostrarFormulario = false;

        this.cargarCitas();

        this.cdr.detectChanges();

      },


      error: (err) => {

        console.error(
          '>>> ERROR CREANDO CITA:',
          err
        );

        this.guardando = false;


        if (err.status === 403) {

          this.error =
            'No tienes permisos para crear citas.';

        }

        else if (err.status === 400) {

          this.error =
            'Los datos de la cita no son válidos.';

        }

        else {

          this.error =
            'No fue posible crear la cita.';

        }

        this.cdr.detectChanges();

      }

    });

  }


  // =========================================================
  // EDITAR CITA
  // =========================================================

  editarCita(
    cita: AppointmentResponse
  ): void {

    this.editandoId = cita.id;

    this.editServicioId =
      cita.serviceId;

    this.editBoxId =
      cita.boxId;


    const fecha =
      new Date(cita.appointmentDate);


    this.editFecha =
      fecha.toISOString().substring(0, 10);

    this.editHora =
      fecha.toTimeString().substring(0, 5);


    this.error = '';

    this.mensaje = '';

    this.cdr.detectChanges();

  }


  // =========================================================
  // CANCELAR EDICIÓN
  // =========================================================

  cancelarEdicion(): void {

    this.editandoId = null;

    this.editServicioId = null;

    this.editBoxId = null;

    this.editFecha = '';

    this.editHora = '';

    this.cdr.detectChanges();

  }


  // =========================================================
  // GUARDAR EDICIÓN
  // =========================================================

  guardarEdicion(
    cita: AppointmentResponse
  ): void {

    this.error = '';

    this.mensaje = '';


    if (!this.editServicioId) {

      this.error =
        'Debe seleccionar una prestación.';

      return;

    }


    if (
      !this.editFecha ||
      !this.editHora
    ) {

      this.error =
        'Debe seleccionar fecha y hora.';

      return;

    }


    const appointmentDate =
      `${this.editFecha}T${this.editHora}:00`;


    const fechaSeleccionada =
      new Date(appointmentDate);


    if (
      isNaN(fechaSeleccionada.getTime()) ||
      fechaSeleccionada <= new Date()
    ) {

      this.error =
        'La fecha y hora de la cita deben ser futuras.';

      return;

    }


    this.actualizando = true;


    this.appointmentsService.update(

      cita.id,

      {

        serviceId:
          this.editServicioId,

        boxId:
          this.editBoxId,

        appointmentDate

      }

    )

    .subscribe({

      next: (actualizada) => {

        console.log(
          '>>> CITA ACTUALIZADA:',
          actualizada
        );

        this.actualizando = false;

        this.mensaje =
          `Cita #${actualizada.id} actualizada correctamente.`;

        this.cancelarEdicion();

        this.cargarCitas();

        this.cdr.detectChanges();

      },


      error: (err) => {

        console.error(
          '>>> ERROR ACTUALIZANDO CITA:',
          err
        );

        this.actualizando = false;


        if (err.status === 403) {

          this.error =
            'No tienes permisos para actualizar citas.';

        }

        else if (err.status === 400) {

          this.error =
            'Los datos de la cita no son válidos.';

        }

        else {

          this.error =
            'No fue posible actualizar la cita.';

        }

        this.cdr.detectChanges();

      }

    });

  }


  // =========================================================
  // CAMBIAR ESTADO
  // =========================================================

  cambiarEstado(

    cita: AppointmentResponse,

    status: AppointmentResponse['status']

  ): void {

    this.error = '';

    this.mensaje = '';

    console.log(
      '>>> CAMBIANDO ESTADO:',
      cita.id,
      status
    );


    this.appointmentsService.updateStatus(

      cita.id,

      {
        status
      }

    )

    .subscribe({

      next: (actualizada) => {

        console.log(
          '>>> ESTADO ACTUALIZADO:',
          actualizada
        );

        this.mensaje =
          `Estado de la cita #${actualizada.id} actualizado correctamente.`;

        this.cargarCitas();

        this.cdr.detectChanges();

      },


      error: (err) => {

        console.error(
          '>>> ERROR CAMBIANDO ESTADO:',
          err
        );

        // Se recarga primero la lista (esto limpia this.error) para que el selector
        // vuelva al estado real de la cita; el mensaje se fija a continuacion.
        this.cargarCitas();


        if (err.status === 403) {

          this.error =
            'No tienes permisos para cambiar el estado de la cita.';

        }

        else if (err.status === 400) {

          this.error =
            'El estado enviado no es válido.';

        }

        else if (err.status === 409) {

          // Regla de negocio (por ejemplo, transicion de estado no permitida):
          // se muestra el mensaje real que envia el servicio de citas
          this.error =
            err.error?.message ??
            'El cambio de estado no está permitido.';

        }

        else {

          this.error =
            'No fue posible cambiar el estado de la cita.';

        }

        this.cdr.detectChanges();

      }

    });

  }


  // =========================================================
  // ELIMINAR CITA
  // =========================================================

  eliminarCita(
    cita: AppointmentResponse
  ): void {

    const confirmar =
      window.confirm(
        `¿Está seguro de eliminar la cita #${cita.id}?`
      );


    if (!confirmar) {

      return;

    }


    this.error = '';

    this.mensaje = '';


    this.appointmentsService.delete(

      cita.id

    )

    .subscribe({

      next: () => {

        console.log(
          '>>> CITA ELIMINADA:',
          cita.id
        );

        this.mensaje =
          `Cita #${cita.id} eliminada correctamente.`;

        this.cargarCitas();

        this.cdr.detectChanges();

      },


      error: (err) => {

        console.error(
          '>>> ERROR ELIMINANDO CITA:',
          err
        );


        if (err.status === 403) {

          this.error =
            'No tienes permisos para eliminar citas.';

        }

        else if (err.status === 404) {

          this.error =
            'La cita no existe.';

        }

        else {

          this.error =
            'No fue posible eliminar la cita.';

        }

        this.cdr.detectChanges();

      }

    });

  }

}