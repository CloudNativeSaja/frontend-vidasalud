import { Component, input } from '@angular/core';

export type NombreIcono =
  | 'panel'
  | 'calendario'
  | 'catalogo'
  | 'grafico'
  | 'escudo'
  | 'salir'
  | 'reloj'
  | 'flecha'
  | 'candado'
  | 'actualizar'
  | 'mas'
  | 'usuario';

/** Íconos de trazo, heredan el color del texto. */
@Component({
  selector: 'app-icono',
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="tamano()"
      [attr.height]="tamano()"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true">
      @switch (nombre()) {
        @case ('panel') {
          <rect x="3.5" y="3.5" width="7" height="8" rx="2" />
          <rect x="13.5" y="3.5" width="7" height="5" rx="2" />
          <rect x="13.5" y="11.5" width="7" height="9" rx="2" />
          <rect x="3.5" y="14.5" width="7" height="6" rx="2" />
        }
        @case ('calendario') {
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
          <path d="M8 14h3" />
        }
        @case ('catalogo') {
          <path d="M5 4.5h11a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3z" />
          <path d="M5 16.5a3 3 0 0 1 3-3h11" />
          <path d="M9 8.5h6" />
        }
        @case ('grafico') {
          <path d="M4 20h16" />
          <path d="M7 16v-5M12 16V6M17 16v-8" />
        }
        @case ('escudo') {
          <path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6z" />
          <path d="m9 12 2 2 4-4" />
        }
        @case ('salir') {
          <path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14" />
          <path d="M10 8l-4 4 4 4M6 12h10" />
        }
        @case ('reloj') {
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        }
        @case ('flecha') {
          <path d="M5 12h14M13 6l6 6-6 6" />
        }
        @case ('candado') {
          <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        }
        @case ('actualizar') {
          <path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3" />
          <path d="M19.5 4.5v4h-4" />
        }
        @case ('mas') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('usuario') {
          <circle cx="12" cy="8.5" r="3.5" />
          <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }
  `
})
export class Icono {
  readonly nombre = input.required<NombreIcono>();
  readonly tamano = input(18);
}
