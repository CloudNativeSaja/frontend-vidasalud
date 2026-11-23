import { TestBed } from '@angular/core/testing';
import { MsalService } from '@azure/msal-angular';
import { of } from 'rxjs';

import { cuentaDePrueba, proveerSesion } from '../../testing/sesion-de-prueba';
import { RolesService, rolesDesdeToken } from './roles.service';

function crear(roles: string[] | null): RolesService {
  TestBed.configureTestingModule({ providers: proveerSesion(roles) });
  const servicio = TestBed.inject(RolesService);
  servicio.sincronizar();
  return servicio;
}

function jwt(payload: object): string {
  const cuerpo = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `cabecera.${cuerpo}.firma`;
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

  it('toma los roles del access token cuando el ID token no los trae', async () => {
    const cuenta = cuentaDePrueba([]);
    let consultas = 0;

    TestBed.configureTestingModule({
      providers: [
        ...proveerSesion([]),
        {
          provide: MsalService,
          useValue: {
            instance: {
              getActiveAccount: () => cuenta,
              getAllAccounts: () => [cuenta],
              setActiveAccount: () => undefined
            },
            acquireTokenSilent: () => {
              consultas++;
              return of({ accessToken: jwt({ roles: ['RECEPCIONISTA'] }) });
            }
          }
        }
      ]
    });

    const sesion = TestBed.inject(RolesService);
    await sesion.cargarRolesDelApi();
    await sesion.cargarRolesDelApi();

    expect(sesion.roles()).toEqual(['RECEPCIONISTA']);
    expect(consultas).toBe(1);
  });

  it('si no se puede leer el access token conserva los roles del ID token', async () => {
    const sesion = crear(['AUDITOR']);

    await sesion.cargarRolesDelApi();

    expect(sesion.roles()).toEqual(['AUDITOR']);
  });
});

describe('rolesDesdeToken', () => {
  it('lee el claim roles', () => {
    expect(rolesDesdeToken(jwt({ roles: ['RECEPCIONISTA'] }))).toEqual(['RECEPCIONISTA']);
  });

  it('devuelve vacío sin claim, sin token o con token inválido', () => {
    expect(rolesDesdeToken(jwt({ name: 'x' }))).toEqual([]);
    expect(rolesDesdeToken(undefined)).toEqual([]);
    expect(rolesDesdeToken('no-es-un-jwt')).toEqual([]);
  });
});
