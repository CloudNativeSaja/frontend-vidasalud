import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { Dashboard } from './dashboard/dashboard';

export const routes: Routes = [
    {
        path: 'dashboard',
        component: Dashboard,
        canActivate: [MsalGuard]
    }
];