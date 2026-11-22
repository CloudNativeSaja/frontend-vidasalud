import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RolesService } from '../../auth/roles.service';
import { ReportService, ResumenOperacion } from '../../services/report.service';
import { saludo } from '../../shared/fechas';
import { Icono } from '../../shared/icono';
import { KpisOperacion } from '../../shared/kpis-operacion';
import { ResumenGraficos } from '../../shared/resumen-graficos';

/** Panel de administración (y de auditoría, en solo lectura). */
@Component({
  selector: 'app-dashboard-admin',
  imports: [DatePipe, RouterLink, Icono, KpisOperacion, ResumenGraficos],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css'
})
export class DashboardAdmin implements OnInit {

  private readonly reportes = inject(ReportService);

  protected readonly sesion = inject(RolesService);

  protected readonly hoy = new Date();
  protected readonly saludo = saludo();

  protected readonly resumen = signal<ResumenOperacion | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal(false);

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(false);

    this.reportes.resumen().subscribe({
      next: resumen => {
        this.resumen.set(resumen);
        this.cargando.set(false);
      },
      error: () => {
        this.resumen.set(null);
        this.error.set(true);
        this.cargando.set(false);
      }
    });
  }
}
