import { Injectable, computed, inject, signal } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';

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

/**
 * Expone la cuenta MSAL activa y los roles que vienen
 * en el claim `roles` del ID token.
 */
@Injectable({ providedIn: 'root' })
export class RolesService {

  private readonly msal = inject(MsalService);

  private readonly cuenta = signal<AccountInfo | null>(null);

  readonly autenticado = computed(() => this.cuenta() !== null);

  readonly roles = computed<Rol[]>(() => {
    const declarados = this.cuenta()?.idTokenClaims?.roles ?? [];
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

  tiene(rol: Rol): boolean {
    return this.roles().includes(rol);
  }

  tieneAlguno(roles: readonly Rol[]): boolean {
    return roles.some(rol => this.roles().includes(rol));
  }
}
