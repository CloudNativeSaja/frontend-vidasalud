import { TestBed } from '@angular/core/testing';

import { proveerSesion } from '../../testing/sesion-de-prueba';
import { RolesService } from './roles.service';

function crear(roles: string[] | null): RolesService {
  TestBed.configureTestingModule({ providers: proveerSesion(roles) });
  const servicio = TestBed.inject(RolesService);
  servicio.sincronizar();
  return servicio;
}

describe('RolesService', () => {

  it('lee los roles del ID token y elige el principal por prioridad', () => {
    const sesion = crear(['PACIENTE', 'RECEPCIONISTA', 'OTRO']);

    expect(sesion.roles()).toEqual(['RECEPCIONISTA', 'PACIENTE']);
    expect(sesion.rolPrincipal()).toBe('RECEPCIONISTA');
    expect(sesion.esSoloPaciente()).toBe(false);
  });

  it('expone oid, nombre e iniciales de la cuenta', () => {
    const sesion = crear(['PACIENTE']);

    expect(sesion.oid()).toBe('oid-paciente-1');
    expect(sesion.primerNombre()).toBe('Ana');
    expect(sesion.iniciales()).toBe('AP');
    expect(sesion.esSoloPaciente()).toBe(true);
  });

  it('sin sesión no hay roles', () => {
    const sesion = crear(null);

    expect(sesion.autenticado()).toBe(false);
    expect(sesion.roles()).toEqual([]);
    expect(sesion.rolPrincipal()).toBeNull();
  });
});
