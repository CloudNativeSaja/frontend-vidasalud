import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  CatalogService,
  HealthService,
  ClinicalBox,
  Slot
} from '../../services/catalog.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})
export class Catalogo implements OnInit {

  private catalogService = inject(CatalogService);

  // =========================
  // DATOS
  // =========================

  services = signal<HealthService[]>([]);
  boxes = signal<ClinicalBox[]>([]);
  slots = signal<Slot[]>([]);

  errorMessage = signal('');
  successMessage = signal('');

  // =========================
  // SECCIONES
  // =========================

  mostrarServicios = false;
  mostrarBoxes = false;
  mostrarSlots = false;

  // =========================
  // FORMULARIOS
  // =========================

  mostrarFormularioServicio = false;
  mostrarFormularioBox = false;
  mostrarFormularioSlot = false;

  editandoServicio = false;
  editandoBox = false;
  editandoSlot = false;

  servicioEditandoId: number | null = null;
  boxEditandoId: number | null = null;
  slotEditandoId: number | null = null;

  // =========================
  // FORM SERVICIO
  // =========================

  servicioForm = {
    name: '',
    description: '',
    price: 0,
    durationMinutes: 30,
    active: true
  };

  // =========================
  // FORM BOX
  // =========================

  boxForm = {
    name: '',
    centerName: '',
    active: true
  };

  // =========================
  // FORM SLOT
  // =========================

  slotForm = {
    boxId: 0,
    serviceId: 0,
    startTime: '',
    available: true
  };


  // =========================
  // INICIO
  // =========================

  ngOnInit(): void {
    this.loadCatalog();
  }


  // =========================
  // CARGAR DATOS
  // =========================

  loadCatalog(): void {

    this.catalogService.getServices()
      .subscribe({
        next: data => {
          console.log('Servicios:', data);
          this.services.set(data);
        },
        error: error => {
          console.error('Error servicios:', error);
          this.errorMessage.set(
            'No se pudieron cargar los servicios.'
          );
        }
      });


    this.catalogService.getBoxes()
      .subscribe({
        next: data => {
          console.log('Boxes:', data);
          this.boxes.set(data);
        },
        error: error => {
          console.error('Error boxes:', error);
          this.errorMessage.set(
            'No se pudieron cargar los boxes.'
          );
        }
      });


    this.catalogService.getSlots()
      .subscribe({
        next: data => {
          console.log('Slots:', data);
          this.slots.set(data);
        },
        error: error => {
          console.error('Error slots:', error);
          this.errorMessage.set(
            'No se pudieron cargar los horarios.'
          );
        }
      });
  }


  // =========================
  // MENSAJES
  // =========================

  limpiarMensajes(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  mostrarExito(mensaje: string): void {
    this.errorMessage.set('');
    this.successMessage.set(mensaje);

    setTimeout(() => {
      this.successMessage.set('');
    }, 3000);
  }


  // =====================================================
  // SERVICIOS
  // =====================================================

  nuevoServicio(): void {

    this.limpiarMensajes();

    this.editandoServicio = false;
    this.servicioEditandoId = null;

    this.servicioForm = {
      name: '',
      description: '',
      price: 0,
      durationMinutes: 30,
      active: true
    };

    this.mostrarFormularioServicio = true;
  }


  editarServicio(service: HealthService): void {

    this.limpiarMensajes();

    this.editandoServicio = true;
    this.servicioEditandoId = service.id;

    this.servicioForm = {
      name: service.name,
      description: service.description,
      price: service.price,
      durationMinutes: service.durationMinutes,
      active: service.active
    };

    this.mostrarFormularioServicio = true;
  }


  cancelarServicio(): void {

    this.mostrarFormularioServicio = false;
    this.editandoServicio = false;
    this.servicioEditandoId = null;
  }


  guardarServicio(): void {

    this.limpiarMensajes();

    if (!this.servicioForm.name.trim()) {
      this.errorMessage.set(
        'El nombre del servicio es obligatorio.'
      );
      return;
    }

    if (this.servicioForm.price < 0) {
      this.errorMessage.set(
        'El precio no puede ser negativo.'
      );
      return;
    }

    if (this.servicioForm.durationMinutes <= 0) {
      this.errorMessage.set(
        'La duración debe ser mayor a 0 minutos.'
      );
      return;
    }

    const request = {
      name: this.servicioForm.name.trim(),
      description: this.servicioForm.description.trim(),
      price: Number(this.servicioForm.price),
      durationMinutes: Number(
        this.servicioForm.durationMinutes
      ),
      active: this.servicioForm.active
    };


    if (
      this.editandoServicio &&
      this.servicioEditandoId !== null
    ) {

      this.catalogService
        .updateService(
          this.servicioEditandoId,
          request
        )
        .subscribe({
          next: () => {
            this.mostrarExito(
              'Servicio actualizado correctamente.'
            );

            this.cancelarServicio();
            this.loadCatalog();
          },
          error: error => {
            console.error(error);

            this.errorMessage.set(
              'No se pudo actualizar el servicio.'
            );
          }
        });

    } else {

      this.catalogService
        .createService(request)
        .subscribe({
          next: () => {

            this.mostrarExito(
              'Servicio creado correctamente.'
            );

            this.cancelarServicio();
            this.loadCatalog();
          },
          error: error => {
            console.error(error);

            this.errorMessage.set(
              'No se pudo crear el servicio.'
            );
          }
        });
    }
  }


  eliminarServicio(service: HealthService): void {

    if (
      !confirm(
        `¿Eliminar el servicio "${service.name}"?`
      )
    ) {
      return;
    }

    this.limpiarMensajes();

    this.catalogService
      .deleteService(service.id)
      .subscribe({
        next: () => {

          this.mostrarExito(
            'Servicio eliminado correctamente.'
          );

          this.loadCatalog();
        },
        error: error => {

          console.error(error);

          this.errorMessage.set(
            'No se pudo eliminar el servicio. Puede estar siendo utilizado por un horario.'
          );
        }
      });
  }


  // =====================================================
  // BOXES
  // =====================================================

  nuevoBox(): void {

    this.limpiarMensajes();

    this.editandoBox = false;
    this.boxEditandoId = null;

    this.boxForm = {
      name: '',
      centerName: '',
      active: true
    };

    this.mostrarFormularioBox = true;
  }


  editarBox(box: ClinicalBox): void {

    this.limpiarMensajes();

    this.editandoBox = true;
    this.boxEditandoId = box.id;

    this.boxForm = {
      name: box.name,
      centerName: box.centerName,
      active: box.active
    };

    this.mostrarFormularioBox = true;
  }


  cancelarBox(): void {

    this.mostrarFormularioBox = false;
    this.editandoBox = false;
    this.boxEditandoId = null;
  }


  guardarBox(): void {

    this.limpiarMensajes();

    if (!this.boxForm.name.trim()) {

      this.errorMessage.set(
        'El nombre del box es obligatorio.'
      );

      return;
    }

    if (!this.boxForm.centerName.trim()) {

      this.errorMessage.set(
        'El centro de salud es obligatorio.'
      );

      return;
    }

    const request = {
      name: this.boxForm.name.trim(),
      centerName: this.boxForm.centerName.trim(),
      active: this.boxForm.active
    };


    if (
      this.editandoBox &&
      this.boxEditandoId !== null
    ) {

      this.catalogService
        .updateBox(
          this.boxEditandoId,
          request
        )
        .subscribe({
          next: () => {

            this.mostrarExito(
              'Box actualizado correctamente.'
            );

            this.cancelarBox();
            this.loadCatalog();
          },
          error: error => {

            console.error(error);

            this.errorMessage.set(
              'No se pudo actualizar el box.'
            );
          }
        });

    } else {

      this.catalogService
        .createBox(request)
        .subscribe({
          next: () => {

            this.mostrarExito(
              'Box creado correctamente.'
            );

            this.cancelarBox();
            this.loadCatalog();
          },
          error: error => {

            console.error(error);

            this.errorMessage.set(
              'No se pudo crear el box.'
            );
          }
        });
    }
  }


  eliminarBox(box: ClinicalBox): void {

    if (
      !confirm(
        `¿Eliminar el box "${box.name}"?`
      )
    ) {
      return;
    }

    this.limpiarMensajes();

    this.catalogService
      .deleteBox(box.id)
      .subscribe({
        next: () => {

          this.mostrarExito(
            'Box eliminado correctamente.'
          );

          this.loadCatalog();
        },
        error: error => {

          console.error(error);

          this.errorMessage.set(
            'No se pudo eliminar el box. Puede estar asociado a un horario.'
          );
        }
      });
  }


  // =====================================================
  // HORARIOS
  // =====================================================

  nuevoSlot(): void {

    this.limpiarMensajes();

    this.editandoSlot = false;
    this.slotEditandoId = null;

    this.slotForm = {
      boxId: this.boxes().length > 0
        ? this.boxes()[0].id
        : 0,

      serviceId: this.services().length > 0
        ? this.services()[0].id
        : 0,

      startTime: '',
      available: true
    };

    this.mostrarFormularioSlot = true;
  }


  editarSlot(slot: Slot): void {

    this.limpiarMensajes();

    this.editandoSlot = true;
    this.slotEditandoId = slot.id;

    this.slotForm = {
      boxId: slot.boxId,
      serviceId: slot.serviceId,
      startTime: this.toDatetimeLocal(
        slot.startTime
      ),
      available: slot.available
    };

    this.mostrarFormularioSlot = true;
  }


  cancelarSlot(): void {

    this.mostrarFormularioSlot = false;
    this.editandoSlot = false;
    this.slotEditandoId = null;
  }


  guardarSlot(): void {

    this.limpiarMensajes();

    if (!this.slotForm.boxId) {

      this.errorMessage.set(
        'Debe seleccionar un box.'
      );

      return;
    }

    if (!this.slotForm.serviceId) {

      this.errorMessage.set(
        'Debe seleccionar un servicio.'
      );

      return;
    }

    if (!this.slotForm.startTime) {

      this.errorMessage.set(
        'Debe seleccionar fecha y hora.'
      );

      return;
    }

    const request = {
      boxId: Number(this.slotForm.boxId),
      serviceId: Number(this.slotForm.serviceId),
      startTime: this.normalizarFecha(
        this.slotForm.startTime
      ),
      available: this.slotForm.available
    };


    if (
      this.editandoSlot &&
      this.slotEditandoId !== null
    ) {

      this.catalogService
        .updateSlot(
          this.slotEditandoId,
          request
        )
        .subscribe({
          next: () => {

            this.mostrarExito(
              'Horario actualizado correctamente.'
            );

            this.cancelarSlot();
            this.loadCatalog();
          },
          error: error => {

            console.error(error);

            this.errorMessage.set(
              'No se pudo actualizar el horario.'
            );
          }
        });

    } else {

      this.catalogService
        .createSlot(request)
        .subscribe({
          next: () => {

            this.mostrarExito(
              'Horario creado correctamente.'
            );

            this.cancelarSlot();
            this.loadCatalog();
          },
          error: error => {

            console.error(error);

            this.errorMessage.set(
              'No se pudo crear el horario.'
            );
          }
        });
    }
  }


  eliminarSlot(slot: Slot): void {

    if (
      !confirm(
        `¿Eliminar el horario de ${slot.serviceName} a las ${this.formatearFecha(slot.startTime)}?`
      )
    ) {
      return;
    }

    this.limpiarMensajes();

    this.catalogService
      .deleteSlot(slot.id)
      .subscribe({
        next: () => {

          this.mostrarExito(
            'Horario eliminado correctamente.'
          );

          this.loadCatalog();
        },
        error: error => {

          console.error(error);

          this.errorMessage.set(
            'No se pudo eliminar el horario.'
          );
        }
      });
  }


  // =====================================================
  // UTILIDADES
  // =====================================================

  toDatetimeLocal(value: string): string {

    if (!value) {
      return '';
    }

    return value.substring(0, 16);
  }


  normalizarFecha(value: string): string {

    if (
      value.length === 16
    ) {
      return `${value}:00`;
    }

    return value;
  }


  formatearFecha(value: string): string {

    if (!value) {
      return '';
    }

    const fecha = new Date(value);

    if (isNaN(fecha.getTime())) {
      return value.replace('T', ' ');
    }

    return fecha.toLocaleString(
      'es-CL',
      {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    );
  }

}