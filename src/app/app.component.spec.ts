// Prueba de humo del componente raíz: comprueba que el layout se arma con sus tres partes.
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

// Agrupa las pruebas del componente raíz.
describe('AppComponent', () => {
  // Valida que existan navbar, main y footer. Se proveen router y HttpClient de prueba porque los componentes hijos inyectan servicios que los necesitan.
  it('muestra navbar, contenido principal y footer', () => {
    TestBed.configureTestingModule({ imports: [AppComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('app-navbar')).not.toBeNull();
    expect(el.querySelector('main')).not.toBeNull();
    expect(el.querySelector('app-footer')).not.toBeNull();
  });
});
