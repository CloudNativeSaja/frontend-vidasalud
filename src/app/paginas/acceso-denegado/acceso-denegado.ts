import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RolesService } from '../../auth/roles.service';
import { Icono } from '../../shared/icono';

@Component({
  selector: 'app-acceso-denegado',
  imports: [RouterLink, Icono],
  template: `
    <section class="pagina">
      <div class="tarjeta">
        <div class="vacio">
          <span class="vacio-icono"><app-icono nombre="candado" [tamano]="22" /></span>
          <h3>Esta sección no está <em>disponible</em> para tu rol</h3>
          <p>
            Tu perfil actual es <strong>{{ sesion.nombreRol() }}</strong>.
            Si necesitas entrar aquí, pide acceso al administrador.
          </p>
          <a routerLink="/dashboard" class="btn btn-primario">
            Volver al panel
            <app-icono nombre="flecha" [tamano]="16" />
          </a>
        </div>
      </div>
    </section>
  `
})
export class AccesoDenegado {
  protected readonly sesion = inject(RolesService);
}
