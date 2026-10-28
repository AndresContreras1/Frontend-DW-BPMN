import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { InvitarUsuarioComponent } from '../components/invitar-usuario/invitar-usuario.component';
import { LoginResponse } from '../models/auth.model';
import { PermisoEstructuraResponse } from '../models/permiso-estructura.model';
import { InvitacionUsuarioResponse, UsuarioResponse } from '../models/usuario.model';
import { AuthService } from '../service/auth.service';
import { EmpresaService } from '../service/empresa.service';
import { NotificacionService } from '../service/notificacion.service';
import { PermisoEstructuraService } from '../service/permiso-estructura.service';
import { UsuarioService } from '../service/usuario.service';
import { InvitacionComponent } from './invitacion/invitacion.component';
import { LoginComponent } from './login/login.component';
import { PermisosComponent } from './permisos/permisos.component';
import { RegistroComponent } from './registro/registro.component';
import { UsuariosComponent } from './usuarios/usuarios.component';

const admin: UsuarioResponse = { id: 1, nombre: 'Admin', email: 'admin@demo.com', rolAcceso: 'ADMINISTRADOR', activo: true };
const editor: UsuarioResponse = { id: 2, nombre: 'Edith', email: 'edith@demo.com', rolAcceso: 'EDITOR', activo: true };

function http400(detail: string): HttpErrorResponse {
  return new HttpErrorResponse({ status: 400, error: { detail } });
}

function rellenar(form: { setValue: (v: never) => void }, valores: Record<string, string>): void {
  form.setValue(valores as never);
}

describe('LoginComponent', () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['login']);
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: auth }] });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('ingresar_formularioInvalido_noLlamaAlBackend', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    fixture.componentInstance.ingresar();
    expect(auth.login).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLButtonElement).querySelector<HTMLButtonElement>('#btnIngresar')?.disabled).toBeTrue();
  });

  it('ingresar_credencialesCorrectas_navegaAProcesos', () => {
    const respuesta: LoginResponse = { accessToken: 't', tokenType: 'Bearer', expiresIn: 1800, usuario: admin };
    auth.login.and.returnValue(of(respuesta));
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({ email: 'a@demo.com', password: 'x' });
    fixture.componentInstance.ingresar();
    expect(router.navigate).toHaveBeenCalledWith(['/procesos']);
  });

  it('ingresar_credencialesIncorrectas_muestraMensajeGenerico', () => {
    auth.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({ email: 'a@demo.com', password: 'mala' });
    fixture.componentInstance.ingresar();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#alertaErrorLogin')?.textContent).toContain('Correo o contraseña incorrectos');
    expect(fixture.componentInstance.enviando()).toBeFalse();
  });
});

describe('RegistroComponent', () => {
  let empresas: jasmine.SpyObj<EmpresaService>;
  const valores = {
    nombreEmpresa: 'Acme',
    nit: '123',
    correoContacto: 'c@acme.com',
    nombreAdmin: 'Ana',
    emailAdmin: 'ana@acme.com',
    passwordAdmin: '12345678'
  };

  beforeEach(() => {
    empresas = jasmine.createSpyObj<EmpresaService>('EmpresaService', ['registrar']);
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: EmpresaService, useValue: empresas }] });
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  it('registrar_formularioInvalido_marcaCamposYNoEnvia', () => {
    const fixture = TestBed.createComponent(RegistroComponent);
    fixture.detectChanges();
    fixture.componentInstance.registrar();
    expect(empresas.registrar).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.nit.touched).toBeTrue();
  });

  it('registrar_datosValidos_navegaAlLogin', () => {
    empresas.registrar.and.returnValue(of({ id: 1, nombre: 'Acme', nit: '123', correoContacto: 'c@acme.com', fechaRegistro: '2026-01-01' }));
    const fixture = TestBed.createComponent(RegistroComponent);
    fixture.componentInstance.form.setValue(valores);
    fixture.componentInstance.registrar();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/login']);
  });

  it('registrar_error400_muestraErroresPorCampo', () => {
    empresas.registrar.and.returnValue(throwError(() => http400('nit: El NIT es obligatorio.')));
    const fixture = TestBed.createComponent(RegistroComponent);
    fixture.componentInstance.form.setValue(valores);
    fixture.componentInstance.registrar();
    expect(fixture.componentInstance.erroresServidor()['nit']).toBe('El NIT es obligatorio.');
    expect(fixture.componentInstance.error()).toContain('Revisa los campos');
  });

  it('registrar_nitDuplicado409_muestraElDetalleDelBackend', () => {
    empresas.registrar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Ya existe una empresa con ese NIT.' } })));
    const fixture = TestBed.createComponent(RegistroComponent);
    fixture.componentInstance.form.setValue(valores);
    fixture.componentInstance.registrar();
    expect(fixture.componentInstance.error()).toBe('Ya existe una empresa con ese NIT.');
  });
});

describe('InvitacionComponent', () => {
  let usuarios: jasmine.SpyObj<UsuarioService>;

  beforeEach(() => {
    usuarios = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['aceptarInvitacion']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: UsuarioService, useValue: usuarios },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { token: 'tok-1' } } } }
      ]
    });
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  it('aceptar_datosValidos_usaElTokenDeLaRuta', () => {
    usuarios.aceptarInvitacion.and.returnValue(of(editor));
    const fixture = TestBed.createComponent(InvitacionComponent);
    fixture.componentInstance.form.setValue({ nombre: 'Edith', password: '12345678' });
    fixture.componentInstance.aceptar();
    expect(usuarios.aceptarInvitacion).toHaveBeenCalledWith('tok-1', { nombre: 'Edith', password: '12345678' });
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/login']);
  });

  it('aceptar_tokenVencido_muestraElError', () => {
    usuarios.aceptarInvitacion.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'La invitación expiró.' } })));
    const fixture = TestBed.createComponent(InvitacionComponent);
    fixture.componentInstance.form.setValue({ nombre: 'Edith', password: '12345678' });
    fixture.componentInstance.aceptar();
    expect(fixture.componentInstance.error()).toBe('La invitación expiró.');
  });

  it('aceptar_formularioInvalido_noEnvia', () => {
    const fixture = TestBed.createComponent(InvitacionComponent);
    fixture.componentInstance.aceptar();
    expect(usuarios.aceptarInvitacion).not.toHaveBeenCalled();
  });
});

describe('InvitarUsuarioComponent', () => {
  it('invitar_emiteLaInvitacionCreada', () => {
    const invitacion: InvitacionUsuarioResponse = { id: 1, email: 'n@demo.com', rolAcceso: 'EDITOR', token: 'abc', fechaExpiracion: '2026-12-01T00:00:00' };
    const usuarios = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['invitar']);
    usuarios.invitar.and.returnValue(of(invitacion));
    TestBed.configureTestingModule({ providers: [{ provide: UsuarioService, useValue: usuarios }] });
    const fixture = TestBed.createComponent(InvitarUsuarioComponent);
    let emitida: InvitacionUsuarioResponse | undefined;
    fixture.componentInstance.invitada.subscribe((i) => (emitida = i));
    rellenar(fixture.componentInstance.form, { email: 'n@demo.com', rolAcceso: 'EDITOR' });
    fixture.componentInstance.invitar();
    expect(usuarios.invitar).toHaveBeenCalledWith({ email: 'n@demo.com', rolAcceso: 'EDITOR' });
    expect(emitida).toEqual(invitacion);
  });

  it('invitar_error_muestraElMensajeDelBackend', () => {
    const usuarios = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['invitar']);
    usuarios.invitar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'Ya existe un usuario con ese correo.' } })));
    TestBed.configureTestingModule({ providers: [{ provide: UsuarioService, useValue: usuarios }] });
    const fixture = TestBed.createComponent(InvitarUsuarioComponent);
    rellenar(fixture.componentInstance.form, { email: 'n@demo.com', rolAcceso: 'EDITOR' });
    fixture.componentInstance.invitar();
    expect(fixture.componentInstance.error()).toBe('Ya existe un usuario con ese correo.');
  });

  it('invitar_formularioInvalido_noEnvia', () => {
    const usuarios = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['invitar']);
    TestBed.configureTestingModule({ providers: [{ provide: UsuarioService, useValue: usuarios }] });
    const fixture = TestBed.createComponent(InvitarUsuarioComponent);
    fixture.componentInstance.invitar();
    expect(usuarios.invitar).not.toHaveBeenCalled();
  });
});

describe('UsuariosComponent', () => {
  let usuarios: jasmine.SpyObj<UsuarioService>;

  function crear() {
    usuarios.listar.and.returnValue(of([admin, editor]));
    const fixture = TestBed.createComponent(UsuariosComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    localStorage.clear();
    usuarios = jasmine.createSpyObj<UsuarioService>('UsuarioService', ['listar', 'actualizar', 'desactivar', 'invitar']);
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), { provide: UsuarioService, useValue: usuarios }] });
    TestBed.inject(AuthService).limpiarSesion();
  });

  it('inicio_listaLosUsuarios', () => {
    const fixture = crear();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('#tablaUsuarios tbody tr').length).toBe(2);
  });

  it('inicio_errorAlListar_avisaYDejaDeCargar', () => {
    usuarios.listar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const fixture = TestBed.createComponent(UsuariosComponent);
    spyOn(TestBed.inject(NotificacionService), 'error');
    fixture.detectChanges();
    expect(fixture.componentInstance.cargando()).toBeFalse();
    expect(TestBed.inject(NotificacionService).error).toHaveBeenCalled();
  });

  it('cambiarRol_reemplazaLaFilaConLaRespuestaDelBackend', () => {
    usuarios.actualizar.and.returnValue(of({ ...editor, rolAcceso: 'SOLO_LECTURA' }));
    const fixture = crear();
    fixture.componentInstance.cambiarRol(editor, 'SOLO_LECTURA');
    expect(fixture.componentInstance.usuarios()[1].rolAcceso).toBe('SOLO_LECTURA');
  });

  it('cambiarRol_error_noCambiaLaLista', () => {
    usuarios.actualizar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'No se puede.' } })));
    const fixture = crear();
    fixture.componentInstance.cambiarRol(editor, 'SOLO_LECTURA');
    expect(fixture.componentInstance.usuarios()[1].rolAcceso).toBe('EDITOR');
  });

  it('desactivar_saleDeLaListaDeActivosSoloCuandoElBackendConfirma', () => {
    usuarios.desactivar.and.returnValue(of(undefined));
    const fixture = crear();
    fixture.componentInstance.pedirDesactivar(editor);
    expect(fixture.componentInstance.usuarioADesactivar()).toEqual(editor);
    expect(fixture.componentInstance.usuarios().length).toBe(2);
    fixture.componentInstance.confirmarDesactivar();
    expect(fixture.componentInstance.usuarios().length).toBe(1);
    expect(fixture.componentInstance.usuarioADesactivar()).toBeNull();
  });

  it('cambiarVista_pideLosDesactivadosConActivoFalse', () => {
    const fixture = crear();
    usuarios.listar.and.returnValue(of([{ ...editor, activo: false }]));
    fixture.componentInstance.cambiarVista(true);
    expect(usuarios.listar).toHaveBeenCalledWith(false);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#btnReactivar2')).not.toBeNull();
    fixture.componentInstance.cambiarVista(false);
    expect(usuarios.listar).toHaveBeenCalledWith(undefined);
  });

  it('desactivar_error_mantieneAlUsuarioActivo', () => {
    usuarios.desactivar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'No puedes desactivarte.' } })));
    const fixture = crear();
    fixture.componentInstance.pedirDesactivar(editor);
    fixture.componentInstance.confirmarDesactivar();
    expect(fixture.componentInstance.usuarios()[1].activo).toBeTrue();
  });

  it('cancelarDesactivar_cierraElModal', () => {
    const fixture = crear();
    fixture.componentInstance.pedirDesactivar(editor);
    fixture.componentInstance.cancelarDesactivar();
    expect(fixture.componentInstance.usuarioADesactivar()).toBeNull();
    fixture.componentInstance.confirmarDesactivar();
    expect(usuarios.desactivar).not.toHaveBeenCalled();
  });

  it('reactivar_saleDeLaListaDeDesactivadosConLaRespuesta', () => {
    usuarios.actualizar.and.returnValue(of({ ...editor, activo: true }));
    usuarios.listar.and.returnValue(of([{ ...editor, activo: false }]));
    const fixture = TestBed.createComponent(UsuariosComponent);
    fixture.detectChanges();
    fixture.componentInstance.cambiarVista(true);
    fixture.componentInstance.reactivar(editor);
    expect(fixture.componentInstance.usuarios().length).toBe(0);
  });

  it('reactivar_error_avisa', () => {
    usuarios.actualizar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403, error: { detail: 'Sin permisos' } })));
    const fixture = crear();
    spyOn(TestBed.inject(NotificacionService), 'error');
    fixture.componentInstance.reactivar(editor);
    expect(TestBed.inject(NotificacionService).error).toHaveBeenCalledWith('Sin permisos');
  });

  it('alInvitar_muestraElEnlaceConElToken', () => {
    const fixture = crear();
    const invitacion: InvitacionUsuarioResponse = { id: 1, email: 'n@demo.com', rolAcceso: 'EDITOR', token: 'xyz', fechaExpiracion: '2026-12-01' };
    fixture.componentInstance.alInvitar(invitacion);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#txtEnlaceInvitacion')?.textContent).toContain('/invitacion/xyz');
    expect(fixture.componentInstance.etiquetaRol('EDITOR')).toBe('Editor');
  });
});

describe('PermisosComponent', () => {
  const permisos: PermisoEstructuraResponse[] = [
    { rolAcceso: 'EDITOR', crearPool: true, editarPool: true, eliminarPool: false, crearLane: true, editarLane: true, eliminarLane: false }
  ];
  let servicio: jasmine.SpyObj<PermisoEstructuraService>;

  beforeEach(() => {
    servicio = jasmine.createSpyObj<PermisoEstructuraService>('PermisoEstructuraService', ['listar', 'actualizar']);
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: PermisoEstructuraService, useValue: servicio }] });
  });

  it('inicio_construyeUnaFilaPorRol', () => {
    servicio.listar.and.returnValue(of(permisos));
    const fixture = TestBed.createComponent(PermisosComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('#tablaPermisos tbody tr').length).toBe(1);
    expect(fixture.componentInstance.etiquetaRol('EDITOR')).toBe('Editor');
  });

  it('guardar_enviaLosSeisPermisos', () => {
    servicio.listar.and.returnValue(of(permisos));
    servicio.actualizar.and.returnValue(of({ ...permisos[0], eliminarPool: true }));
    const fixture = TestBed.createComponent(PermisosComponent);
    fixture.detectChanges();
    const fila = fixture.componentInstance.filas()[0];
    fila.form.controls.eliminarPool.setValue(true);
    fixture.componentInstance.guardar(fila);
    expect(servicio.actualizar).toHaveBeenCalledWith('EDITOR', jasmine.objectContaining({ eliminarPool: true }));
    expect(fixture.componentInstance.guardando()).toBeNull();
  });

  it('guardar_error_avisaYLiberaElBoton', () => {
    servicio.listar.and.returnValue(of(permisos));
    servicio.actualizar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403, error: { detail: 'Sin permisos' } })));
    const fixture = TestBed.createComponent(PermisosComponent);
    fixture.detectChanges();
    fixture.componentInstance.guardar(fixture.componentInstance.filas()[0]);
    expect(fixture.componentInstance.guardando()).toBeNull();
  });

  it('inicio_errorAlListar_dejaDeCargar', () => {
    servicio.listar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    const fixture = TestBed.createComponent(PermisosComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.cargando()).toBeFalse();
  });
});
