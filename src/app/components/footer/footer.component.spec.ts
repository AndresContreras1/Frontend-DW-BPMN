// Prueba generada por Angular CLI: confirma que el pie de página se crea sin errores.
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterComponent } from './footer.component';

// Agrupa las pruebas del footer.
describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  // Configura el módulo con el componente standalone (va en imports, no en declarations) y lo renderiza antes de cada prueba.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Valida que la instancia del componente existe.
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
