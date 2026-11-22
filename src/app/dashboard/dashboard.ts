import { Component, inject } from '@angular/core';

import { RolesService } from '../auth/roles.service';
import { DashboardAdmin } from './admin/dashboard-admin';
import { DashboardPaciente } from './paciente/dashboard-paciente';
import { DashboardRecepcion } from './recepcion/dashboard-recepcion';

/** Elige el panel según el rol principal de la sesión. */
@Component({
  imports: [DashboardAdmin, DashboardRecepcion, DashboardPaciente],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  protected readonly sesion = inject(RolesService);
}
