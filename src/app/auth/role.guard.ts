import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Rol, RolesService } from './roles.service';

/**
 * Permite el acceso solo si la cuenta activa tiene alguno de los
 * roles indicados en `data.roles` de la ruta.
 * Se usa después de MsalGuard: `canActivate: [MsalGuard, roleGuard]`.
 */
export const roleGuard: CanActivateFn = route => {
  const sesion = inject(RolesService);
  const router = inject(Router);

  sesion.sincronizar();

  const permitidos = (route.data['roles'] ?? []) as Rol[];

  if (permitidos.length === 0 || sesion.tieneAlguno(permitidos)) {
    return true;
  }

  return router.createUrlTree(['/acceso-denegado']);
};

/** En la raíz: con sesión iniciada se va directo al panel. */
export const inicioGuard: CanActivateFn = () => {
  const sesion = inject(RolesService);
  const router = inject(Router);

  sesion.sincronizar();

  return sesion.autenticado()
    ? router.createUrlTree(['/dashboard'])
    : true;
};
