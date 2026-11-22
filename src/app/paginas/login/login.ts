import { Component, inject } from '@angular/core';
import { MsalService } from '@azure/msal-angular';

import { VIDA_SALUD_API_SCOPE } from '../../auth/api-scope';
import { Icono } from '../../shared/icono';
import { Logo } from '../../shared/logo';

@Component({
  selector: 'app-login',
  imports: [Icono, Logo],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private readonly msalService = inject(MsalService);

  protected readonly anio = new Date().getFullYear();

  login(): void {
    this.msalService.loginRedirect({
      scopes: [VIDA_SALUD_API_SCOPE]
    });
  }
}
