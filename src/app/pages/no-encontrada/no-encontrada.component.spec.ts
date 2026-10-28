// Prueba de humo de la página 404: verifica que el componente se crea y pinta contenido.
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoEncontradaComponent } from './no-encontrada.component';

// Agrupa las pruebas de NoEncontradaComponent.
describe('NoEncontradaComponent', () => {
  let fixture: ComponentFixture<NoEncontradaComponent>;

  beforeEach(() => {
    // provideRouter([]) da un Router vacío: el componente usa RouterLink y necesita un Router, pero no navegamos.
    TestBed.configureTestingModule({ imports: [NoEncontradaComponent], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(NoEncontradaComponent);
    fixture.detectChanges();
  });

  // Valida que la instancia existe y que el HTML renderizó texto (no quedó vacío).
  it('se crea y pinta su contenido', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).textContent?.length).toBeGreaterThan(0);
  });
});
