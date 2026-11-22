import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';

import { ReportService, ResumenOperacion } from '../../services/report.service';
import { Icono } from '../../shared/icono';
import { KpisOperacion } from '../../shared/kpis-operacion';
import { ResumenGraficos } from '../../shared/resumen-graficos';

@Component({
  imports: [DatePipe, Icono, KpisOperacion, ResumenGraficos],
  selector: 'app-reportes',
  styleUrl: './reportes.css',
  templateUrl: './reportes.html',
})
export class Reportes implements OnInit {

  private readonly reportes = inject(ReportService);

  protected readonly resumen = signal<ResumenOperacion | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);
  protected readonly actualizado = signal<Date | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);

    this.reportes.resumen().subscribe({
      next: resumen => {
        this.resumen.set(resumen);
        this.actualizado.set(new Date());
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(true);
        this.cargando.set(false);
      }
    });
  }
}
