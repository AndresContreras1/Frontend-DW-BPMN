import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RolProcesoFormComponent } from '../../components/rol-proceso-form/rol-proceso-form.component';
import { PageResponse } from '../../models/pagina.model';
import { RolProcesoConsultaResponse } from '../../models/rol-proceso.model';
import { RolProcesoService } from '../../service/rol-proceso.service';
import { RolesComponent } from './roles.component';

const libre: RolProcesoConsultaResponse = { id: 1, nombre: 'Analista', descripcion: 'Analiza', procesos: [], enUso: false };
const enUso: RolProcesoConsultaResponse = { id: 2, nombre: 'Gerente', descripcion: 'Decide', procesos: ['Vacaciones', 'Compras'], enUso: true };

function pagina(content: RolProcesoConsultaResponse[], page = 0, totalPages = 1): PageResponse<RolProcesoConsultaResponse> {
  return { content, page, size: 10, totalElements: content.length, totalPages };
}

describe('RolesComponent', () => {
  let servicio: jasmine.SpyObj<RolProcesoService>;

  function crear(contenido: RolProcesoConsultaResponse[] = [libre, enUso], page = 0, totalPages = 1) {
    servicio.buscar.and.returnValue(of(pagina(contenido, page, totalPages)));
    const fixture = TestBed.createComponent(RolesComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    servicio = jasmine.createSpyObj<RolProcesoService>('RolProcesoService', ['buscar', 'crear', 'editar', 'eliminar']);
    TestBed.configureTestingModule({ providers: [{ provide: RolProcesoService, useValue: servicio }] });
  });

  it('listado_muestraEnQueProcesosEstaUsadoCadaRol', () => {
    const el: HTMLElement = crear().nativeElement;
    expect(el.querySelector('#filaRol2')?.textContent).toContain('Vacaciones, Compras');
    expect(el.querySelector<HTMLButtonElement>('#btnEliminarRol2')?.disabled).toBeTrue();
    expect(el.querySelector<HTMLButtonElement>('#btnEliminarRol1')?.disabled).toBeFalse();
  });

  it('buscar_enviaElNombreYReiniciaLaPagina', () => {
    const fixture = crear();
    fixture.componentInstance.busqueda.setValue(' ger ');
    fixture.componentInstance.buscar();
    expect(servicio.buscar).toHaveBeenCalledWith('ger', 0);
  });

  it('listado_vacio_muestraEstadoVacio', () => {
    expect((crear([]).nativeElement as HTMLElement).textContent).toContain('No hay roles de proceso');
  });

  it('listado_error_muestraElMensaje', () => {
    servicio.buscar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403, error: { detail: 'Sin permisos' } })));
    const fixture = TestBed.createComponent(RolesComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBe('Sin permisos');
  });

  it('crear_guardaYRecargaElListado', () => {
    const fixture = crear();
    servicio.crear.and.returnValue(of({ id: 9, nombre: 'Nuevo', procesosQueLoUsan: 0, enUso: false }));
    fixture.componentInstance.nuevo();
    expect(fixture.componentInstance.formularioAbierto()).toBeTrue();
    fixture.componentInstance.guardar({ nombre: 'Nuevo' });
    expect(servicio.crear).toHaveBeenCalledWith({ nombre: 'Nuevo' });
    expect(fixture.componentInstance.formularioAbierto()).toBeFalse();
    expect(servicio.buscar).toHaveBeenCalledTimes(2);
  });

  it('editar_usaPutConElIdDelRol', () => {
    const fixture = crear();
    servicio.editar.and.returnValue(of({ id: 1, nombre: 'Analista Sr', procesosQueLoUsan: 0, enUso: false }));
    fixture.componentInstance.editar(libre);
    fixture.componentInstance.guardar({ nombre: 'Analista Sr' });
    expect(servicio.editar).toHaveBeenCalledWith(1, { nombre: 'Analista Sr' });
  });

  it('guardar_nombreDuplicado_muestraErroresYMantieneElFormulario', () => {
    const fixture = crear();
    servicio.crear.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'nombre: El nombre es obligatorio.' } })));
    fixture.componentInstance.nuevo();
    fixture.componentInstance.guardar({ nombre: '' });
    expect(fixture.componentInstance.erroresForm()['nombre']).toBe('El nombre es obligatorio.');
    expect(fixture.componentInstance.formularioAbierto()).toBeTrue();
  });

  it('eliminar_recargaCuandoElBackendConfirma', () => {
    const fixture = crear();
    servicio.eliminar.and.returnValue(of(undefined));
    fixture.componentInstance.pedirEliminar(libre);
    fixture.componentInstance.confirmarEliminar();
    expect(servicio.eliminar).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.rolAEliminar()).toBeNull();
  });

  it('eliminar_ultimaFilaDeLaPagina_retrocedeUnaPagina', () => {
    const fixture = crear([libre], 2, 3);
    servicio.eliminar.and.returnValue(of(undefined));
    fixture.componentInstance.pedirEliminar(libre);
    fixture.componentInstance.confirmarEliminar();
    expect(servicio.buscar).toHaveBeenCalledWith('', 1);
  });

  it('eliminar_error409_avisaSinQuitarLaFila', () => {
    const fixture = crear();
    servicio.eliminar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'El rol está en uso.' } })));
    fixture.componentInstance.pedirEliminar(libre);
    fixture.componentInstance.confirmarEliminar();
    expect(fixture.componentInstance.pagina()?.content.length).toBe(2);
    expect(fixture.componentInstance.eliminando()).toBeFalse();
  });

  it('cancelarEliminar_ySinSeleccion_noEliminan', () => {
    const fixture = crear();
    fixture.componentInstance.pedirEliminar(libre);
    fixture.componentInstance.cancelarEliminar();
    fixture.componentInstance.confirmarEliminar();
    expect(servicio.eliminar).not.toHaveBeenCalled();
  });
});

describe('RolProcesoFormComponent', () => {
  it('enviar_sinNombre_noEmite', () => {
    const fixture = TestBed.createComponent(RolProcesoFormComponent);
    fixture.detectChanges();
    let emitido = false;
    fixture.componentInstance.guardar.subscribe(() => (emitido = true));
    fixture.componentInstance.enviar();
    expect(emitido).toBeFalse();
  });

  it('enviar_recortaElNombreYOmiteDescripcionVacia', () => {
    const fixture = TestBed.createComponent(RolProcesoFormComponent);
    fixture.detectChanges();
    let emitido: unknown;
    fixture.componentInstance.guardar.subscribe((v) => (emitido = v));
    fixture.componentInstance.form.setValue({ nombre: ' Gerente ', descripcion: '  ' });
    fixture.componentInstance.enviar();
    expect(emitido).toEqual({ nombre: 'Gerente', descripcion: undefined });
  });

  it('conRol_precargaElFormulario', () => {
    const fixture = TestBed.createComponent(RolProcesoFormComponent);
    fixture.componentRef.setInput('rol', libre);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.getRawValue().nombre).toBe('Analista');
  });

  it('cancelar_emiteElEvento', () => {
    const fixture = TestBed.createComponent(RolProcesoFormComponent);
    fixture.detectChanges();
    let cancelado = false;
    fixture.componentInstance.cancelar.subscribe(() => (cancelado = true));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#btnCancelarRol')?.click();
    expect(cancelado).toBeTrue();
  });
});
