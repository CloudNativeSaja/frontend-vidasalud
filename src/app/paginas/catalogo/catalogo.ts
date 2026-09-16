import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CatalogService } from '../../services/catalog.service';

interface HealthService {
  id: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  active: boolean;
}

interface ClinicalBox {
  id: number;
  name: string;
  centerName: string;
  active: boolean;
}

interface Slot {
  id: number;
  boxId: number;
  serviceId: number;
  startTime: string;
  available: boolean;
}


@Component({
  selector: 'app-catalogo',
  imports: [
    CommonModule
  ],
  templateUrl: './catalogo.html',
  styleUrl: './catalogo.css'
})

export class Catalogo implements OnInit {
  private catalogService = inject(CatalogService);

  services = signal<HealthService[]>([]);
  boxes = signal<ClinicalBox[]>([]);
  slots = signal<Slot[]>([]);

  errorMessage = signal('');

  ngOnInit(): void {
    this.loadCatalog();
  }

  private loadCatalog(): void {
    this.catalogService.getServices()
      .subscribe({
        next: (data) => {
          console.log(
            'Servicios:',
            data
          );
          this.services.set(data);
        },
        error: (error) => {
          console.error(
            'Error servicios',
            error
          );
          this.errorMessage.set(
            'Error cargando servicios'
          );
        }
      });

    this.catalogService.getBoxes()
      .subscribe({
        next: (data) => {
          console.log(
            'Boxes:',
            data
          );
          this.boxes.set(data);
        },
        error: (error) => {
          console.error(
            'Error boxes',
            error
          );
          this.errorMessage.set(
            'Error cargando boxes'
          );
        }
      });

    this.catalogService.getSlots()
      .subscribe({
        next: (data) => {
          console.log(
            'Slots:',
            data
          );
          this.slots.set(data);
        },
        error: (error) => {
          console.error(
            'Error slots',
            error
          );
          this.errorMessage.set(
            'Error cargando slots'
          );
        }
      });
  }
}