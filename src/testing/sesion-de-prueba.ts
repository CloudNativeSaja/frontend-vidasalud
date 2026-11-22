import { Provider } from '@angular/core';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { Subject } from 'rxjs';

/** Cuenta MSAL de prueba con los roles indicados. */
export function cuentaDePrueba(roles: string[], nombre = 'Ana Pérez'): AccountInfo {
  return {
    homeAccountId: 'home-1',
    environment: 'login.microsoftonline.com',
    tenantId: 'tenant-1',
    username: 'ana@vidasalud.cl',
    localAccountId: 'local-1',
    name: nombre,
    idTokenClaims: { roles, oid: 'oid-paciente-1' }
  };
}

/**
 * Proveedores de MSAL falsos para pruebas. Sin roles (`null`)
 * simula una sesión no iniciada.
 */
export function proveerSesion(roles: string[] | null): Provider[] {
  let activa: AccountInfo | null = roles ? cuentaDePrueba(roles) : null;

  const instance = {
    getActiveAccount: () => activa,
    getAllAccounts: () => (activa ? [activa] : []),
    setActiveAccount: (cuenta: AccountInfo | null) => {
      activa = cuenta;
    }
  };

  return [
    {
      provide: MsalService,
      useValue: {
        instance,
        loginRedirect: () => undefined,
        logoutRedirect: () => undefined
      }
    },
    {
      provide: MsalBroadcastService,
      useValue: { msalSubject$: new Subject() }
    }
  ];
}
