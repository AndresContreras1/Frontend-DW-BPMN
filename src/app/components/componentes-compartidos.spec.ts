// Pruebas unitarias (Jasmine + TestBed) de los componentes compartidos: paginador, modal, campo de formulario,
// componentes simples (vacío, spinner, toasts) y navbar. Cada 'describe' agrupa un componente y cada 'it' un comportamiento.
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

// Componente anfitrión de prueba: el paginador necesita un padre que le pase inputs y reciba su output.
// El signal 'pagina' simula el estado del padre y 'destino' guarda lo que el paginador emite.
@Component({
  imports: [PaginadorComponent],
  template: '<app-paginador [pagina]="pagina()" [totalPaginas]="3" [totalElementos]="25" (cambiarPagina)="destino = $event" />'
})
class PaginadorHostComponent {
  readonly pagina = signal(0);
  destino = -1;
}

// Paginador: navegación entre páginas y casos límite.
describe('PaginadorComponent', () => {
  // Valida que Siguiente y un número concreto emiten la página destino (base 0) y que el texto muestra el total de resultados.
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

  // Valida que en la página 0 el botón Anterior está deshabilitado y que ir() ignora destinos inválidos (sin emitir).
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

  // Valida que con una sola página no se dibuja la navegación (no hay nada que paginar).
  it('conUnaSolaPagina_noSeMuestra', () => {
    const fixture = TestBed.createComponent(PaginadorComponent);
    fixture.componentRef.setInput('pagina', 0);
    fixture.componentRef.setInput('totalPaginas', 1);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('nav')).toBeNull();
  });
});

// Modal de confirmación: visibilidad y eventos.
describe('ModalConfirmacionComponent', () => {
  // Valida que con abierto=false el modal no existe en el DOM.
  it('cerrado_noPintaNada', () => {
    const fixture = TestBed.createComponent(ModalConfirmacionComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#modalConfirmacion')).toBeNull();
  });

  // Valida que abierto muestra las advertencias y que los botones disparan los outputs confirmar y cancelar.
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

// Campo de formulario: errores, mensajes y tipo de control.
describe('CampoFormularioComponent', () => {
  // Ayuda: crea el componente con inputs obligatorios mediante setInput (la forma de pasar input() en pruebas).
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

  // Valida que un campo inválido pero no tocado todavía no muestra error (no regañar antes de tiempo).
  it('sinTocar_noMuestraErrores', () => {
    const fixture = crear(new FormControl('', { nonNullable: true, validators: [Validators.required] }));
    expect((fixture.nativeElement as HTMLElement).querySelector('#txtNombreError')).toBeNull();
  });

  // Valida que al tocar un campo requerido vacío aparece el mensaje de obligatorio y mostrarError() es true.
  it('tocadoYVacio_muestraQueEsObligatorio', () => {
    const control = new FormControl('', { nonNullable: true, validators: [Validators.required] });
    const fixture = crear(control);
    control.markAsTouched();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#txtNombreError')?.textContent).toContain('obligatorio');
    expect(fixture.componentInstance.mostrarError()).toBeTrue();
  });

  // Valida que cada validador (email, minlength, maxlength, ...) y el error del servidor generan su texto.
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

  // Valida que el tipo elegido dibuja el control correcto (textarea o select con sus opciones).
  it('tipoTextareaYSelect_renderizaElControlCorrecto', () => {
    const area = crear(new FormControl('', { nonNullable: true }), 'textarea');
    expect((area.nativeElement as HTMLElement).querySelector('textarea')).not.toBeNull();
    const select = crear(new FormControl('A', { nonNullable: true }), 'select');
    expect((select.nativeElement as HTMLElement).querySelector('option')?.textContent).toContain('Opción A');
  });
});

// Componentes mínimos de presentación.
describe('Componentes simples', () => {
  // Valida que el estado vacío muestra el mensaje recibido por input.
  it('estadoVacio_muestraElMensaje', () => {
    const fixture = TestBed.createComponent(EstadoVacioComponent);
    fixture.componentRef.setInput('mensaje', 'Sin procesos');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin procesos');
  });

  // Valida que el spinner muestra su texto por defecto.
  it('spinner_muestraElTexto', () => {
    const fixture = TestBed.createComponent(SpinnerCargaComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Cargando');
  });

  // Valida que una notificación del servicio aparece y desaparece al pulsar el botón de cerrar.
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

// Navbar: contenido según sesión y rol.
describe('NavbarComponent', () => {
  // Se limpia localStorage (ahí vive la sesión) para que cada prueba parta sin usuario, y se proveen router y HTTP simulados.
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  });

  // Valida que un visitante ve Iniciar sesión y no los enlaces de trabajo.
  it('sinSesion_muestraLoginYRegistro', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#lnkLogin')).not.toBeNull();
    expect(el.querySelector('#lnkProcesos')).toBeNull();
  });

  // Valida que el administrador ve la sección Usuarios y su rol en la insignia.
  it('administrador_veTodasLasSecciones', () => {
    TestBed.inject(TokenService).guardarSesion('t', { id: 1, nombre: 'Ana', email: 'a', rolAcceso: 'ADMINISTRADOR', activo: true });
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#lnkUsuarios')).not.toBeNull();
    expect(el.querySelector('#txtRolAcceso')?.textContent).toContain('Administrador');
  });

  // Valida que un usuario de solo lectura ve Procesos pero no la administración.
  it('soloLectura_noVeAdministracion', () => {
    TestBed.inject(TokenService).guardarSesion('t', { id: 1, nombre: 'Luis', email: 'l', rolAcceso: 'SOLO_LECTURA', activo: true });
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#lnkProcesos')).not.toBeNull();
    expect(el.querySelector('#lnkUsuarios')).toBeNull();
  });

  // Valida que aunque el backend falle (500) la sesión local se cierra: el usuario siempre debe poder salir.
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

