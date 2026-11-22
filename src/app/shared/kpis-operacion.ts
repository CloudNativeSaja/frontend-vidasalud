import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';

import { ResumenOperacion } from '../services/report.service';

/** Los cuatro indicadores principales, en cifras grandes. */
@Component({
  selector: 'app-kpis-operacion',
  imports: [DecimalPipe],
  template: `
    <div class="kpis">
      <div class="kpi">
        <span class="kpi-valor">{{ resumen().atenciones | number }}</span>
        <span class="kpi-etiqueta">Atenciones registradas</span>
      </div>

      <div class="kpi">
        <span class="kpi-valor">
          @if (resumen().tasaCancelacion !== null) {
            {{ resumen().tasaCancelacion | number: '1.0-1' }}<small>%</small>
          } @else { — }
        </span>
        <span class="kpi-etiqueta">Tasa de cancelación</span>
      </div>

      <div class="kpi">
        <span class="kpi-valor">
          @if (resumen().esperaPromedioDias !== null) {
            {{ resumen().esperaPromedioDias | number: '1.0-1' }}<small>días</small>
          } @else { — }
        </span>
        <span class="kpi-etiqueta">Espera promedio, de la solicitud a la cita</span>
      </div>

      <div class="kpi">
        <span class="kpi-valor">
          @if (resumen().ocupacion !== null) {
            {{ resumen().ocupacion | number: '1.0-0' }}<small>%</small>
          } @else { — }
        </span>
        <span class="kpi-etiqueta">Ocupación de horarios</span>
      </div>
    </div>
  `
})
export class KpisOperacion {
  readonly resumen = input.required<ResumenOperacion>();
}
