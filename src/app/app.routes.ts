import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { Dashboard } from './dashboard/dashboard';
import { Citas } from './paginas/citas/citas';
import { Catalogo } from './paginas/catalogo/catalogo';
import { Reportes } from './paginas/reportes/reportes';
import { Auditoria } from './paginas/auditoria/auditoria';

export const routes: Routes = [
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [MsalGuard]
    },
    {
        path: 'citas',
        component: Citas,
        canActivate: [MsalGuard]
    },
    {
        path: 'catalogo',
        component: Catalogo,
        canActivate: [MsalGuard]
    },
    {
        path: 'reportes',
        component: Reportes,
        canActivate: [MsalGuard]
    },
    {
        path: 'auditoria',
        component: Auditoria,
        canActivate: [MsalGuard]
    }
];