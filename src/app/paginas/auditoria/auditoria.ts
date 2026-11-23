import { DatePipe, JsonPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { Icono } from '../../shared/icono';
import {
  AuditService,
  CategoriaEvento,
  EventoAuditoria
} from '../../services/audit.service';

export type { CategoriaEvento, EventoAuditoria } from '../../services/audit.service';

const FILTROS: { valor: CategoriaEvento | 'TODOS'; etiqueta: string }[] = [
  { valor: 'TODOS', etiqueta: 'Todos' },
  { valor: 'CITAS', etiqueta: 'Citas' },
  { valor: 'CATALOGO', etiqueta: 'Catálogo' },
  { valor: 'MENSAJERIA', etiqueta: 'Mensajería' },
  { valor: 'ACCESO', etiqueta: 'Acceso' }
];

/** Cuántos eventos recientes se cargan en la línea de tiempo. */
const LIMITE_EVENTOS = 200;

/**
 * Línea de tiempo de auditoría (solo lectura).
 *
 * Los eventos los arma ms-vidasalud-audit a partir de Kafka y llegan por el
 * BFF (GET /api/bff/audit/events, roles ADMIN y AUDITOR).
 */
@Component({
  imports: [DatePipe, JsonPipe, Icono],
  selector: 'app-auditoria',
  styleUrl: './auditoria.css',
  templateUrl: './auditoria.html',
})
export class Auditoria implements OnInit {

  private readonly auditoria = inject(AuditService);

  protected readonly filtros = FILTROS;

  protected readonly eventos = signal<EventoAuditoria[]>([]);
  protected readonly filtro = signal<CategoriaEvento | 'TODOS'>('TODOS');
  protected readonly seleccionado = signal<EventoAuditoria | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly visibles = computed(() =>
    this.filtro() === 'TODOS'
      ? this.eventos()
      : this.eventos().filter(e => e.categoria === this.filtro())
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.auditoria.getEvents(undefined, LIMITE_EVENTOS).subscribe({
      next: eventos => {
        this.eventos.set(eventos);
        this.seleccionado.set(null);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set(
          'No fue posible cargar la auditoría. Revisa que el backend y Kafka estén en línea.'
        );
        this.cargando.set(false);
      }
    });
  }
}
