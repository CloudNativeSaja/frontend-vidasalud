import { Component, computed, input } from '@angular/core';

import { ORDEN_ESTADOS, ResumenOperacion } from '../services/report.service';
import { COLOR_ESTADO, NOMBRE_ESTADO } from './estados';

/** Barra apilada de citas por estado y ranking de prestaciones. */
@Component({
  selector: 'app-resumen-graficos',
  template: `
    <article class="tarjeta">
      <div class="tarjeta-cabecera">
        <div>
          <h3>Citas por estado</h3>
          <p>{{ resumen().atenciones }} citas registradas en total.</p>
        </div>
      </div>

      @if (resumen().atenciones > 0) {
        <div class="barra-apilada" role="img" [attr.aria-label]="descripcion()">
          @for (tramo of tramos(); track tramo.estado) {
            @if (tramo.cantidad > 0) {
              <span
                [style.flex-grow]="tramo.cantidad"
                [style.background]="tramo.color"
                [attr.title]="tramo.etiqueta + ': ' + tramo.cantidad"></span>
            }
          }
        </div>

        <ul class="leyenda">
          @for (tramo of tramos(); track tramo.estado) {
            <li>
              <span class="punto" [style.background]="tramo.color"></span>
              <span>{{ tramo.etiqueta }}</span>
              <strong class="mono">{{ tramo.cantidad }}</strong>
            </li>
          }
        </ul>
      } @else {
        <p class="texto-2">Todavía no hay citas registradas.</p>
      }
    </article>

    <article class="tarjeta">
      <div class="tarjeta-cabecera">
        <div>
          <h3>Prestaciones más solicitadas</h3>
          <p>Las cinco con más citas.</p>
        </div>
      </div>

      @if (resumen().prestaciones.length > 0) {
        <ol class="ranking">
          @for (p of resumen().prestaciones; track p.serviceId; let i = $index) {
            <li>
              <span class="posicion mono">{{ i + 1 }}</span>
              <div class="ranking-cuerpo">
                <div class="ranking-fila">
                  <span>{{ p.nombre }}</span>
                  <strong class="mono">{{ p.cantidad }}</strong>
                </div>
                <span class="pista">
                  <span [style.width.%]="(p.cantidad / maximo()) * 100"></span>
                </span>
              </div>
            </li>
          }
        </ol>
      } @else {
        <p class="texto-2">Sin datos de prestaciones todavía.</p>
      }
    </article>
  `,
  styles: `
    :host {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }
    .barra-apilada {
      display: flex;
      height: 22px;
      border-radius: 999px;
      overflow: hidden;
      gap: 2px;
      background: var(--crema);
    }
    .barra-apilada span {
      flex-basis: 0;
      min-width: 6px;
    }
    .leyenda {
      list-style: none;
      margin: 18px 0 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px 18px;
      font-size: 14px;
    }
    .leyenda li {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .leyenda strong {
      margin-left: auto;
    }
    .punto {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      flex-shrink: 0;
    }
    .ranking {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .ranking li {
      display: flex;
      gap: 14px;
      align-items: center;
    }
    .posicion {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--crema);
      font-size: 12px;
      flex-shrink: 0;
    }
    .ranking-cuerpo {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ranking-fila {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
    }
    .pista {
      height: 6px;
      border-radius: 999px;
      background: var(--crema);
      overflow: hidden;
    }
    .pista span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--bosque);
    }
  `
})
export class ResumenGraficos {
  readonly resumen = input.required<ResumenOperacion>();

  protected readonly tramos = computed(() =>
    ORDEN_ESTADOS.map(estado => ({
      estado,
      etiqueta: NOMBRE_ESTADO[estado] ?? estado,
      color: COLOR_ESTADO[estado],
      cantidad: this.resumen().porEstado[estado] ?? 0
    }))
  );

  protected readonly maximo = computed(() =>
    Math.max(1, ...this.resumen().prestaciones.map(p => p.cantidad))
  );

  protected readonly descripcion = computed(() =>
    this.tramos()
      .map(t => `${t.etiqueta}: ${t.cantidad}`)
      .join(', ')
  );
}
