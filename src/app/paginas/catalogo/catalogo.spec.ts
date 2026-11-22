import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { proveerSesion } from '../../../testing/sesion-de-prueba';
import { Catalogo } from './catalogo';

describe('Catalogo', () => {
  let component: Catalogo;
  let fixture: ComponentFixture<Catalogo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Catalogo],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...proveerSesion(['RECEPCIONISTA'])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Catalogo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('Catalogo en solo lectura', () => {
  it('recepción no ve botones de crear, editar ni eliminar', async () => {
    await TestBed.configureTestingModule({
      imports: [Catalogo],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...proveerSesion(['RECEPCIONISTA'])
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(Catalogo);
    fixture.componentInstance.mostrarServicios = true;
    fixture.componentInstance.services.set([
      { id: 1, name: 'Medicina general', description: '', price: 1000, durationMinutes: 30, active: true }
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const textos = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .map(b => b.textContent?.trim());

    expect(textos).not.toContain('+ Nuevo servicio');
    expect(textos).not.toContain('Editar');
    expect(textos).not.toContain('Eliminar');
    expect(fixture.componentInstance.puedeEditar()).toBe(false);
  });
});
