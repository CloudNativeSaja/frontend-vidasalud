import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter
} from '@angular/router';

import { proveerSesion } from '../../testing/sesion-de-prueba';
import { roleGuard } from './role.guard';

async function evaluar(rolesUsuario: string[], rolesRuta: string[]) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), ...proveerSesion(rolesUsuario)]
  });

  const ruta = { data: { roles: rolesRuta } } as unknown as ActivatedRouteSnapshot;

  return await TestBed.runInInjectionContext(() =>
    roleGuard(ruta, {} as RouterStateSnapshot)
  );
}

describe('roleGuard', () => {

  it('deja pasar si el usuario tiene alguno de los roles de la ruta', async () => {
    expect(await evaluar(['AUDITOR'], ['ADMIN', 'AUDITOR'])).toBe(true);
  });

  it('redirige a /acceso-denegado si no tiene ninguno', async () => {
    const resultado = await evaluar(['PACIENTE'], ['ADMIN']);
    const router = TestBed.inject(Router);

    expect(resultado).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/acceso-denegado');
  });

  it('deja pasar si la ruta no declara roles', async () => {
    expect(await evaluar(['PACIENTE'], [])).toBe(true);
  });
});
