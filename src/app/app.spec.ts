import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { proveerSesion } from '../testing/sesion-de-prueba';
import { App } from './app';

async function renderizar(roles: string[] | null): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [App],
    providers: [provideRouter([]), ...proveerSesion(roles)]
  }).compileComponents();

  const fixture = TestBed.createComponent(App);
  await fixture.whenStable();
  return fixture.nativeElement as HTMLElement;
}

function enlacesDelMenu(html: HTMLElement): string[] {
  return Array.from(html.querySelectorAll('.nav-lateral a'))
    .map(a => a.textContent?.trim() ?? '');
}

describe('App', () => {

  it('sin sesión no muestra la navegación', async () => {
    const html = await renderizar(null);
    expect(html.querySelector('.barra-lateral')).toBeNull();
  });

  it('ADMIN ve todas las secciones', async () => {
    const html = await renderizar(['ADMIN']);
    expect(enlacesDelMenu(html)).toEqual(['Panel', 'Citas', 'Catálogo', 'Reportes', 'Auditoría']);
  });

  it('AUDITOR solo ve panel y auditoría', async () => {
    const html = await renderizar(['AUDITOR']);
    expect(enlacesDelMenu(html)).toEqual(['Panel', 'Auditoría']);
  });

  it('PACIENTE usa la barra superior', async () => {
    const html = await renderizar(['PACIENTE']);
    expect(html.querySelector('.barra-lateral')).toBeNull();
    expect(html.querySelector('.barra-superior')).not.toBeNull();
  });

  it('sin rol pide acceso al administrador', async () => {
    const html = await renderizar([]);
    expect(html.textContent).toContain('Pide acceso al administrador');
  });
});
