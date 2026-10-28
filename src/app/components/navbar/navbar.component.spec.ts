import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [NavbarComponent], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
  });

  it('se crea y pinta su contenido', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect((fixture.nativeElement as HTMLElement).textContent?.length).toBeGreaterThan(0);
  });
});
