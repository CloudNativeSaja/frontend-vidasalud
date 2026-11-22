import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { proveerSesion } from '../../../testing/sesion-de-prueba';
import { Citas } from './citas';

describe('Citas', () => {
  let component: Citas;
  let fixture: ComponentFixture<Citas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Citas],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...proveerSesion(['PACIENTE'])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Citas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
