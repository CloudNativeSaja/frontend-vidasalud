import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { inicioGuard, roleGuard } from './auth/role.guard';
import { Rol } from './auth/roles.service';

const TODOS: Rol[] = ['ADMIN', 'RECEPCIONISTA', 'PACIENTE', 'AUDITOR'];

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [inicioGuard],
    loadComponent: () =>
      import('./paginas/login/login').then(m => m.Login)
  },
  {
    path: 'dashboard',
    canActivate: [MsalGuard, roleGuard],
    data: { roles: TODOS },
    loadComponent: () =>
      import('./dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'citas',
    canActivate: [MsalGuard, roleGuard],
    data: { roles: ['ADMIN', 'RECEPCIONISTA', 'PACIENTE'] satisfies Rol[] },
    loadComponent: () =>
      import('./paginas/citas/citas').then(m => m.Citas)
  },
  {
    path: 'catalogo',
    canActivate: [MsalGuard, roleGuard],
    data: { roles: ['ADMIN', 'RECEPCIONISTA'] satisfies Rol[] },
    loadComponent: () =>
      import('./paginas/catalogo/catalogo').then(m => m.Catalogo)
  },
  {
    path: 'reportes',
    canActivate: [MsalGuard, roleGuard],
    data: { roles: ['ADMIN'] satisfies Rol[] },
    loadComponent: () =>
      import('./paginas/reportes/reportes').then(m => m.Reportes)
  },
  {
    path: 'auditoria',
    canActivate: [MsalGuard, roleGuard],
    data: { roles: ['ADMIN', 'AUDITOR'] satisfies Rol[] },
    loadComponent: () =>
      import('./paginas/auditoria/auditoria').then(m => m.Auditoria)
  },
  {
    path: 'acceso-denegado',
    canActivate: [MsalGuard],
    loadComponent: () =>
      import('./paginas/acceso-denegado/acceso-denegado')
        .then(m => m.AccesoDenegado)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
