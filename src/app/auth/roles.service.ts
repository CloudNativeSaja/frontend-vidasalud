import { Injectable, computed, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { firstValueFrom } from 'rxjs';

import { VIDA_SALUD_API_SCOPE } from './api-scope';

/**
 * Roles de la aplicación en Microsoft Entra ID.
 * Son los mismos que valida el BFF con @PreAuthorize.
 */
export type Rol = 'ADMIN' | 'RECEPCIONISTA' | 'PACIENTE' | 'AUDITOR';

/** Orden de prioridad para elegir el rol principal de la sesión. */
export const ROLES: readonly Rol[] = [
  'ADMIN',
  'RECEPCIONISTA',
  'AUDITOR',
  'PACIENTE'
];

export const NOMBRE_ROL: Record<Rol, string> = {
  ADMIN: 'Administración',
  RECEPCIONISTA: 'Recepción',
  AUDITOR: 'Auditoría',
  PACIENTE: 'Paciente'
};

/** Extrae el claim `roles` del payload de un JWT (sin validar la firma). */
export function rolesDesdeToken(token: string | undefined): string[] {
  if (!token) {
    return [];
  }

  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    const roles = JSON.parse(json).roles;

    return Array.isArray(roles) ? roles : [];
  } catch {
    return [];
  }
}

/**
 * Expone la cuenta MSAL activa y sus roles.
 *
 * Los roles se asignan en la app VidaSalud-API, por eso viajan en el
 * access token de la API (el mismo que valida el BFF). El ID token solo
 * los trae si también están definidos en VidaSalud-Frontend, así que se
 * combinan ambas fuentes.
 */
@Injectable({ providedIn: 'root' })
export class RolesService {

  private readonly msal = inject(MsalService);

  private readonly cuenta = signal<AccountInfo | null>(null);

  /** Roles leídos del access token de la API (se cargan de forma asíncrona). */
  private readonly rolesDelApi = signal<string[]>([]);
  private cuentaDelApi?: string;
  private cargaDelApi?: Promise<void>;

  readonly autenticado = computed(() => this.cuenta() !== null);

  readonly roles = computed<Rol[]>(() => {
    const declarados = [
      ...(this.cuenta()?.idTokenClaims?.roles ?? []),
      ...this.rolesDelApi()
    ];
    return ROLES.filter(rol => declarados.includes(rol));
  });

  readonly rolPrincipal = computed<Rol | null>(
    () => this.roles()[0] ?? null
  );

  readonly nombreRol = computed(() => {
    const rol = this.rolPrincipal();
    return rol ? NOMBRE_ROL[rol] : 'Sin rol asignado';
  });

  /** Identificador del usuario en Entra ID (claim `oid`). */
  readonly oid = computed(() => {
    const cuenta = this.cuenta();
    return cuenta?.idTokenClaims?.oid ?? cuenta?.localAccountId ?? '';
  });

  readonly nombre = computed(() => {
    const cuenta = this.cuenta();
    return cuenta?.name || cuenta?.username || '';
  });

  readonly primerNombre = computed(
    () => this.nombre().split(/[\s@]/)[0] ?? ''
  );

  readonly iniciales = computed(() => {
    const partes = this.nombre()
      .split(/[\s@.]+/)
      .filter(Boolean);

    return partes
      .slice(0, 2)
      .map(parte => parte[0].toUpperCase())
      .join('');
  });

  /** Solo tiene el rol PACIENTE (sin roles de gestión). */
  readonly esSoloPaciente = computed(
    () => this.rolPrincipal() === 'PACIENTE'
  );

  /**
   * Lee la cuenta activa de MSAL. Si no hay una activa
   * pero existen cuentas en caché, activa la primera.
   */
  sincronizar(): void {
    const instancia = this.msal.instance;

    let activa = instancia.getActiveAccount();

    if (!activa) {
      const cuentas = instancia.getAllAccounts();

      if (cuentas.length > 0) {
        activa = cuentas[0];
        instancia.setActiveAccount(activa);
      }
    }

    this.cuenta.set(activa);
  }

  /**
   * Carga los roles del access token de la API. Se hace una vez por
   * cuenta; si falla, se conservan los roles del ID token y se puede
   * reintentar en la siguiente navegación.
   */
  cargarRolesDelApi(): Promise<void> {
    this.sincronizar();

    const cuenta = this.cuenta();

    if (!cuenta) {
      this.rolesDelApi.set([]);
      this.cuentaDelApi = undefined;
      this.cargaDelApi = undefined;
      return Promise.resolve();
    }

    if (this.cargaDelApi && this.cuentaDelApi === cuenta.homeAccountId) {
      return this.cargaDelApi;
    }

    this.cuentaDelApi = cuenta.homeAccountId;
    this.cargaDelApi = this.leerRolesDelApi(cuenta);
    return this.cargaDelApi;
  }

  private async leerRolesDelApi(cuenta: AccountInfo): Promise<void> {
    try {
      const resultado = await firstValueFrom(
        this.msal.acquireTokenSilent({
          scopes: [VIDA_SALUD_API_SCOPE],
          account: cuenta
        })
      );

      this.rolesDelApi.set(rolesDesdeToken(resultado.accessToken));
    } catch {
      this.rolesDelApi.set([]);
      this.cargaDelApi = undefined;
    }
  }

  tiene(rol: Rol): boolean {
    return this.roles().includes(rol);
  }

  tieneAlguno(roles: readonly Rol[]): boolean {
    return roles.some(rol => this.roles().includes(rol));
  }
}
