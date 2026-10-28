import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TokenService } from '../service/token.service';
import { NotificacionService } from '../service/notificacion.service';
import { CampoFormularioComponent } from './campo-formulario/campo-formulario.component';
import { EstadoVacioComponent } from './estado-vacio/estado-vacio.component';
import { ModalConfirmacionComponent } from './modal-confirmacion/modal-confirmacion.component';
import { NavbarComponent } from './navbar/navbar.component';
import { PaginadorComponent } from './paginador/paginador.component';
import { SpinnerCargaComponent } from './spinner-carga/spinner-carga.component';
import { ToastsComponent } from './toasts/toasts.component';

@Component({
  imports: [PaginadorComponent],
  template: '<app-paginador [pagina]="pagina()" [totalPaginas]="3" [totalElementos]="25" (cambiarPagina)="destino = $event" />'
})
class PaginadorHostComponent {
  readonly pagina = signal(0);
  destino = -1;
}

describe('PaginadorComponent', () => {
  it('siguienteYNumero_emitenLaPaginaDestino', () => {
    const fixture = TestBed.createComponent(PaginadorHostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('#btnPaginaSiguiente') as HTMLButtonElement).click();
    expect(fixture.componentInstance.destino).toBe(1);
    (el.querySelector('#btnPagina3') as HTMLButtonElement).click();
    expect(fixture.componentInstance.destino).toBe(2);
    expect(el.querySelector('#txtTotalElementos')?.textContent).toContain('25 resultados');
  });

  it('enLaPrimeraPagina_anteriorEstaDeshabilitadoYNoEmite', () => {
    const fixture = TestBed.createComponent(PaginadorHostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect((el.querySelector('#btnPaginaAnterior') as HTMLButtonElement).disabled).toBeTrue();
    const paginador = fixture.debugElement.query(By.directive(PaginadorComponent)).componentInstance as PaginadorComponent;
    paginador.ir(0);
    paginador.ir(9);
    expect(fixture.componentInstance.destino).toBe(-1);
  });

  it('conUnaSolaPagina_noSeMuestra', () => {
    const fixture = TestBed.createComponent(PaginadorComponent);
    fixture.componentRef.setInput('pagina', 0);
    fixture.componentRef.setInput('totalPaginas', 1);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('nav')).toBeNull();
  });
});

describe('ModalConfirmacionComponent', () => {
  it('cerrado_noPintaNada', () => {
    const fixture = TestBed.createComponent(ModalConfirmacionComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#modalConfirmacion')).toBeNull();
  });

  it('abierto_muestraAdvertenciasYEmiteConfirmarYCancelar', () => {
    const fixture = TestBed.createComponent(ModalConfirmacionComponent);
    fixture.componentRef.setInput('abierto', true);
    fixture.componentRef.setInput('mensaje', 'Seguro?');
    fixture.componentRef.setInput('advertencias', ['El nodo A quedará sin salida.']);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#listaAdvertencias')?.textContent).toContain('quedará sin salida');
    let confirmado = false;
    let cancelado = false;
    fixture.componentInstance.confirmar.subscribe(() => (confirmado = true));
    fixture.componentInstance.cancelar.subscribe(() => (cancelado = true));
    (el.querySelector('#btnConfirmarModal') as HTMLButtonElement).click();
    (el.querySelector('#btnCancelarModal') as HTMLButtonElement).click();
    expect(confirmado).toBeTrue();
    expect(cancelado).toBeTrue();
  });
});

describe('CampoFormularioComponent', () => {
  function crear(control: FormControl<string>, tipo: 'text' | 'textarea' | 'select' = 'text') {
    const fixture = TestBed.createComponent(CampoFormularioComponent);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('idCampo', 'txtNombre');
    fixture.componentRef.setInput('etiqueta', 'Nombre');
    fixture.componentRef.setInput('tipo', tipo);
    fixture.componentRef.setInput('opciones', [{ valor: 'A', etiqueta: 'Opción A' }]);
    fixture.detectChanges();
    return fixture;
  }

  it('sinTocar_noMuestraErrores', () => {
    const fixture = crear(new FormControl('', { nonNullable: true, validators: [Validators.required] }));
    expect((fixture.nativeElement as HTMLElement).querySelector('#txtNombreError')).toBeNull();
  });

  it('tocadoYVacio_muestraQueEsObligatorio', () => {
    const control = new FormControl('', { nonNullable: true, validators: [Validators.required] });
    const fixture = crear(control);
    control.markAsTouched();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#txtNombreError')?.textContent).toContain('obligatorio');
    expect(fixture.componentInstance.mostrarError()).toBeTrue();
  });

  it('mensajes_cadaValidador_tieneTexto', () => {
    const control = new FormControl('ab', {
      nonNullable: true,
      validators: [Validators.email, Validators.minLength(5), Validators.maxLength(1), Validators.min(3), Validators.pattern('^x$')]
    });
    const fixture = crear(control);
    fixture.componentRef.setInput('errorServidor', 'Duplicado');
    const mensajes = fixture.componentInstance.mensajes().join(' ');
    expect(mensajes).toContain('formato válido');
    expect(mensajes).toContain('al menos 5');
    expect(mensajes).toContain('máximo 1');
    expect(mensajes).toContain('Duplicado');
  });

  it('tipoTextareaYSelect_renderizaElControlCorrecto', () => {
    const area = crear(new FormControl('', { nonNullable: true }), 'textarea');
    expect((area.nativeElement as HTMLElement).querySelector('textarea')).not.toBeNull();
    const select = crear(new FormControl('A', { nonNullable: true }), 'select');
    expect((select.nativeElement as HTMLElement).querySelector('option')?.textContent).toContain('Opción A');
  });
});

describe('Componentes simples', () => {
  it('estadoVacio_muestraElMensaje', () => {
    const fixture = TestBed.createComponent(EstadoVacioComponent);
    fixture.componentRef.setInput('mensaje', 'Sin procesos');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin procesos');
  });

  it('spinner_muestraElTexto', () => {
    const fixture = TestBed.createComponent(SpinnerCargaComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando');
  });

  it('toasts_muestraYCierraLasNotificaciones', () => {
    const fixture = TestBed.createComponent(ToastsComponent);
    TestBed.inject(NotificacionService).exito('Guardado');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.toast')?.textContent).toContain('Guardado');
    (el.querySelector('.btn-close') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.toast')).toBeNull();
  });
});

describe('NavbarComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  });

  it('sinSesion_muestraLoginYRegistro', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#lnkLogin')).not.toBeNull();
    expect(el.querySelector('#lnkProcesos')).toBeNull();
  });

  it('administrador_veTodasLasSecciones', () => {
    TestBed.inject(TokenService).guardarSesion('t', { id: 1, nombre: 'Ana', email: 'a', rolAcceso: 'ADMINISTRADOR', activo: true });
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#lnkUsuarios')).not.toBeNull();
    expect(el.querySelector('#txtRolAcceso')?.textContent).toContain('Administrador');
  });

  it('soloLectura_noVeAdministracion', () => {
    TestBed.inject(TokenService).guardarSesion('t', { id: 1, nombre: 'Luis', email: 'l', rolAcceso: 'SOLO_LECTURA', activo: true });
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#lnkProcesos')).not.toBeNull();
    expect(el.querySelector('#lnkUsuarios')).toBeNull();
  });

  it('cerrarSesion_limpiaLaSesionAunqueFalleElBackend', () => {
    TestBed.inject(TokenService).guardarSesion('t', { id: 1, nombre: 'Ana', email: 'a', rolAcceso: 'EDITOR', activo: true });
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    fixture.componentInstance.cerrarSesion();
    const control = TestBed.inject(HttpTestingController);
    control.expectOne((r) => r.url.endsWith('/auth/logout')).flush({}, { status: 500, statusText: 'Error' });
    expect(fixture.componentInstance.auth.autenticado()).toBeFalse();
  });
});

