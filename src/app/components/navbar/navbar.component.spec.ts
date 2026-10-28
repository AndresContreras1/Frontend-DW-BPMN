// Prueba de humo (smoke test) del navbar: verifica que se crea y renderiza. Las pruebas por rol están en componentes-compartidos.spec.ts.
// Prueba de humo (smoke test) del navbar: verifica que se crea y renderiza. Las pruebas por rol están en componentes-compartidos.spec.ts.
// Prueba de humo (smoke test) del navbar: verifica que se crea y renderiza. Las pruebas por rol están en componentes-compartidos.spec.ts.
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavbarComponent } from './navbar.component';

// Agrupa las pruebas del navbar.
// Agrupa las pruebas del navbar.
// Agrupa las pruebas del navbar.
describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;

  // Antes de cada prueba: módulo de pruebas con router y HttpClient simulados (AuthService necesita HTTP) y se crea el componente.
  // Antes de cada prueba: módulo de pruebas con router y HttpClient simulados (AuthService necesita HTTP) y se crea el componente.
  // Antes de cada prueba: módulo de pruebas con router y HttpClient simulados (AuthService necesita HTTP) y se crea el componente.
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [NavbarComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
  });

  // Valida que el componente se instancia y que su plantilla produce texto (no queda vacía).
  // Valida que el componente se instancia y que su plantilla produce texto (no queda vacía).
  // Valida que el componente se instancia y que su plantilla produce texto (no queda vacía).
  it('se crea y pinta su contenido', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).textContent?.length).toBeGreaterThan(0);
  });
});
