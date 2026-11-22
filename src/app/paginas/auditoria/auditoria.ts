import { DatePipe, JsonPipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

import { Icono } from '../../shared/icono';

export type CategoriaEvento = 'CITAS' | 'CATALOGO' | 'MENSAJERIA' | 'ACCESO';

/** Forma esperada de un evento de auditoría publicado por el backend. */
export interface EventoAuditoria {
  eventId: string;
  traceId: string;
  correlationId: string;
  categoria: CategoriaEvento;
  accion: string;
  usuario: string;
  ocurridoEn: string;
  payload: unknown;
}

const FILTROS: { valor: CategoriaEvento | 'TODOS'; etiqueta: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'CITAS', etiqueta: 'Citas' },
  { valor: 'CATALOGO', etiqueta: 'Catálogo' },
  { valor: 'MENSAJERIA', etiqueta: 'Mensajería' },
  { valor: 'ACCESO', etiqueta: 'Acceso' }
];

/**
 * Línea de tiempo de auditoría (solo lectura).
 * El BFF aún no expone un endpoint de eventos, por lo que la lista
 * parte vacía y la vista muestra el estado correspondiente.
 */
@Component({
  imports: [DatePipe, JsonPipe, Icono],
  selector: 'app-auditoria',
  styleUrl: './auditoria.css',
  templateUrl: './auditoria.html',
})
export class Auditoria {

  protected readonly filtros = FILTROS;

  protected readonly eventos = signal<EventoAuditoria[]>([]);
  protected readonly filtro = signal<CategoriaEvento | 'TODOS'>('TODOS');
  protected readonly seleccionado = signal<EventoAuditoria | null>(null);

  protected readonly visibles = computed(() =>
    this.filtro() === 'TODOS'
      ? this.eventos()
      : this.eventos().filter(e => e.categoria === this.filtro())
  );
}
