import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import {
  MsalBroadcastService,
  MsalService
} from '@azure/msal-angular';

import {
  AuthenticationResult,
  EventMessage,
  EventType
} from '@azure/msal-browser';

import { filter } from 'rxjs/operators';

import { Rol, RolesService } from './auth/roles.service';
import { Icono, NombreIcono } from './shared/icono';
import { Logo } from './shared/logo';

interface ItemMenu {
  ruta: string;
  etiqueta: string;
  icono: NombreIcono;
  roles: Rol[];
}

const MENU: ItemMenu[] = [
  {
    ruta: '/dashboard',
    etiqueta: 'Panel',
    icono: 'panel',
    roles: ['ADMIN', 'RECEPCIONISTA', 'AUDITOR', 'PACIENTE']
  },
  {
    ruta: '/citas',
    etiqueta: 'Citas',
    icono: 'calendario',
    roles: ['ADMIN', 'RECEPCIONISTA', 'PACIENTE']
  },
  {
    ruta: '/catalogo',
    etiqueta: 'Catálogo',
    icono: 'catalogo',
    roles: ['ADMIN', 'RECEPCIONISTA']
  },
  {
    ruta: '/reportes',
    etiqueta: 'Reportes',
    icono: 'grafico',
    roles: ['ADMIN']
  },
  {
    ruta: '/auditoria',
    etiqueta: 'Auditoría',
    icono: 'escudo',
    roles: ['ADMIN', 'AUDITOR']
  }
];

const EVENTOS_DE_SESION = new Set<EventType>([
  EventType.INITIALIZE_END,
  EventType.LOGIN_SUCCESS,
  EventType.ACQUIRE_TOKEN_SUCCESS,
  EventType.ACTIVE_ACCOUNT_CHANGED,
  EventType.LOGOUT_SUCCESS
]);

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icono, Logo],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  private readonly msalService = inject(MsalService);
  private readonly msalBroadcastService = inject(MsalBroadcastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sesion = inject(RolesService);

  protected readonly menu = computed(() =>
    MENU.filter(item => this.sesion.tieneAlguno(item.roles))
  );

  ngOnInit(): void {
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => EVENTOS_DE_SESION.has(msg.eventType)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((msg: EventMessage) => {
        if (msg.eventType === EventType.LOGIN_SUCCESS) {
          const payload = msg.payload as AuthenticationResult;
          this.msalService.instance.setActiveAccount(payload.account);
        }

        this.sesion.sincronizar();
        void this.sesion.cargarRolesDelApi();
      });

    this.sesion.sincronizar();
    void this.sesion.cargarRolesDelApi();
  }

  logout(): void {
    this.msalService.logoutRedirect();
  }
}
