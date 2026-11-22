import { Component, input } from '@angular/core';

/** Marca VidaSalud: ícono de cruz de cuatro hojas y logotipo. */
@Component({
  selector: 'app-logo',
  template: `
    <svg
      class="logo-icono"
      viewBox="-40 -40 80 80"
      [attr.width]="tamano()"
      [attr.height]="tamano()"
      aria-hidden="true">
      <circle
        r="39"
        fill="#13403A"
        [attr.stroke]="tono() === 'claro' ? 'rgba(245,242,236,0.35)' : 'none'"
        stroke-width="2" />
      <g fill="#C9E86F">
        <path [attr.d]="hoja" />
        <path [attr.d]="hoja" transform="rotate(90)" />
        <path [attr.d]="hoja" transform="rotate(180)" />
        <path [attr.d]="hoja" transform="rotate(270)" />
      </g>
      <circle r="4.5" fill="#F5F2EC" />
    </svg>
    @if (conTexto()) {
      <span class="logo-texto" [class.claro]="tono() === 'claro'">
        <em>Vida</em><strong>Salud</strong>
      </span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icono {
      flex-shrink: 0;
    }
    .logo-texto {
      font-size: 22px;
      line-height: 1;
      color: var(--tinta);
      letter-spacing: -0.01em;
    }
    .logo-texto.claro {
      color: var(--crema);
    }
    em {
      font-family: var(--serif);
      font-size: 1.15em;
      font-weight: 400;
    }
    strong {
      font-family: var(--sans);
      font-weight: 700;
    }
  `
})
export class Logo {
  readonly tamano = input(34);
  readonly tono = input<'claro' | 'oscuro'>('oscuro');
  readonly conTexto = input(true);

  protected readonly hoja =
    'M0 -4 C -8 -10 -9 -22 0 -29 C 9 -22 8 -10 0 -4Z';
}
