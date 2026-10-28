import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoEncontradaComponent } from './no-encontrada.component';

describe('NoEncontradaComponent', () => {
  let fixture: ComponentFixture<NoEncontradaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [NoEncontradaComponent], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(NoEncontradaComponent);
    fixture.detectChanges();
  });

  it('se crea y pinta su contenido', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).textContent?.length).toBeGreaterThan(0);
  });
});
