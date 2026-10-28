// Pruebas unitarias de la página /roles (HU-17 a HU-20) y de su formulario hijo RolProcesoFormComponent.
// Se reemplaza RolProcesoService por un espía de Jasmine (jasmine.createSpyObj) para no tocar el backend real: cada prueba controla qué responde
// (of(...) = éxito, throwError(...) = fallo con HttpErrorResponse) y verifica el estado del componente y las llamadas hechas al servicio.
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RolProcesoFormComponent } from '../../components/rol-proceso-form/rol-proceso-form.component';
import { PageResponse } from '../../models/pagina.model';
import { RolProcesoConsultaResponse } from '../../models/rol-proceso.model';
import { RolProcesoService } from '../../service/rol-proceso.service';
import { RolesComponent } from './roles.component';

// Rol de prueba que NO está en uso: se puede eliminar.
const libre: RolProcesoConsultaResponse = { id: 1, nombre: 'Analista', descripcion: 'Analiza', procesos: [], enUso: false };
// Rol de prueba que SÍ está en uso por dos procesos: su botón Eliminar debe estar deshabilitado.
const enUso: RolProcesoConsultaResponse = { id: 2, nombre: 'Gerente', descripcion: 'Decide', procesos: ['Vacaciones', 'Compras'], enUso: true };

// Fábrica de una página del backend (PageResponse) con el contenido dado, para simular paginación.
function pagina(content: RolProcesoConsultaResponse[], page = 0, totalPages = 1): PageResponse<RolProcesoConsultaResponse> {
  return { content, page, size: 10, totalElements: content.length, totalPages };
}

// Agrupa las pruebas de la página de roles de proceso.
describe('RolesComponent', () => {
  let servicio: jasmine.SpyObj<RolProcesoService>;

  // Ayudante: configura la respuesta de buscar(), crea el componente y dispara la detección de cambios (ejecuta ngOnInit y la primera carga).
  function crear(contenido: RolProcesoConsultaResponse[] = [libre, enUso], page = 0, totalPages = 1) {
    servicio.buscar.and.returnValue(of(pagina(contenido, page, totalPages)));
    const fixture = TestBed.createComponent(RolesComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    // Antes de cada prueba: crea el espía del servicio y lo inyecta en lugar del real (así el aislamiento es total).
    servicio = jasmine.createSpyObj<RolProcesoService>('RolProcesoService', ['buscar', 'crear', 'editar', 'eliminar']);
    TestBed.configureTestingModule({ providers: [{ provide: RolProcesoService, useValue: servicio }] });
  });

  // Valida la regla "rol en uso no se elimina": la fila lista los procesos que lo usan y su botón Eliminar está deshabilitado; el rol libre sí puede eliminarse.
  it('listado_muestraEnQueProcesosEstaUsadoCadaRol', () => {
    const el: HTMLElement = crear().nativeElement;
    expect(el.querySelector('#filaRol2')?.textContent).toContain('Vacaciones, Compras');
    expect(el.querySelector<HTMLButtonElement>('#btnEliminarRol2')?.disabled).toBeTrue();
    expect(el.querySelector<HTMLButtonElement>('#btnEliminarRol1')?.disabled).toBeFalse();
  });

  // Valida que la búsqueda recorta espacios (trim) y siempre vuelve a la página 0 al filtrar.
  it('buscar_enviaElNombreYReiniciaLaPagina', () => {
    const fixture = crear();
    fixture.componentInstance.busqueda.setValue(' ger ');
    fixture.componentInstance.buscar();
    expect(servicio.buscar).toHaveBeenCalledWith('ger', 0);
  });

  // Valida que una lista sin resultados muestra el mensaje de estado vacío en vez de una tabla.
  it('listado_vacio_muestraEstadoVacio', () => {
    expect((crear([]).nativeElement as HTMLElement).textContent).toContain('No hay roles de proceso');
  });

  // Valida el manejo de un error 403: el componente guarda en error() el "detail" del ProblemDetail del backend.
  it('listado_error_muestraElMensaje', () => {
    servicio.buscar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 403, error: { detail: 'Sin permisos' } })));
    const fixture = TestBed.createComponent(RolesComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBe('Sin permisos');
  });

  // Valida la estrategia pesimista al crear: tras el OK se cierra el formulario y se vuelve a pedir la lista (buscar se llama 2 veces: carga inicial + recarga).
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

  // Valida que en modo edición se llama a editar(id, datos) y no a crear.
  it('editar_usaPutConElIdDelRol', () => {
    const fixture = crear();
    servicio.editar.and.returnValue(of({ id: 1, nombre: 'Analista Sr', procesosQueLoUsan: 0, enUso: false }));
    fixture.componentInstance.editar(libre);
    fixture.componentInstance.guardar({ nombre: 'Analista Sr' });
    expect(servicio.editar).toHaveBeenCalledWith(1, { nombre: 'Analista Sr' });
  });

  // Valida un 400 con error por campo: se extrae el mensaje del campo "nombre" y el formulario permanece abierto para corregir.
  it('guardar_nombreDuplicado_muestraErroresYMantieneElFormulario', () => {
    const fixture = crear();
    servicio.crear.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400, error: { detail: 'nombre: El nombre es obligatorio.' } })));
    fixture.componentInstance.nuevo();
    fixture.componentInstance.guardar({ nombre: '' });
    expect(fixture.componentInstance.erroresForm()['nombre']).toBe('El nombre es obligatorio.');
    expect(fixture.componentInstance.formularioAbierto()).toBeTrue();
  });

  // Valida el flujo de eliminación en dos pasos (pedir y confirmar): se llama al backend con el id y se cierra la confirmación.
  it('eliminar_recargaCuandoElBackendConfirma', () => {
    const fixture = crear();
    servicio.eliminar.and.returnValue(of(undefined));
    fixture.componentInstance.pedirEliminar(libre);
    fixture.componentInstance.confirmarEliminar();
    expect(servicio.eliminar).toHaveBeenCalledWith(1);
    expect(fixture.componentInstance.rolAEliminar()).toBeNull();
  });

  // Valida la paginación: si se elimina el único elemento de la última página (índice 2), se recarga la página anterior (índice 1) para no quedar en una vacía.
  it('eliminar_ultimaFilaDeLaPagina_retrocedeUnaPagina', () => {
    const fixture = crear([libre], 2, 3);
    servicio.eliminar.and.returnValue(of(undefined));
    fixture.componentInstance.pedirEliminar(libre);
    fixture.componentInstance.confirmarEliminar();
    expect(servicio.buscar).toHaveBeenCalledWith('', 1);
  });

  // Valida el error 409 (rol en uso): la lista queda intacta (2 filas) y se apaga el estado "eliminando"; nada cambia en pantalla sin confirmación del backend.
  it('eliminar_error409_avisaSinQuitarLaFila', () => {
    const fixture = crear();
    servicio.eliminar.and.returnValue(throwError(() => new HttpErrorResponse({ status: 409, error: { detail: 'El rol está en uso.' } })));
    fixture.componentInstance.pedirEliminar(libre);
    fixture.componentInstance.confirmarEliminar();
    expect(fixture.componentInstance.pagina()?.content.length).toBe(2);
    expect(fixture.componentInstance.eliminando()).toBeFalse();
  });

  // Valida que cancelar el modal, o confirmar sin haber elegido un rol, nunca llama al backend.
  it('cancelarEliminar_ySinSeleccion_noEliminan', () => {
    const fixture = crear();
    fixture.componentInstance.pedirEliminar(libre);
    fixture.componentInstance.cancelarEliminar();
    fixture.componentInstance.confirmarEliminar();
    expect(servicio.eliminar).not.toHaveBeenCalled();
  });
});

// Pruebas del formulario hijo reutilizable de alta/edición de roles de proceso.
describe('RolProcesoFormComponent', () => {
  // Valida el formulario reactivo: sin nombre (obligatorio) no se emite el evento guardar.
  it('enviar_sinNombre_noEmite', () => {
    const fixture = TestBed.createComponent(RolProcesoFormComponent);
    fixture.detectChanges();
    let emitido = false;
    fixture.componentInstance.guardar.subscribe(() => (emitido = true));
    fixture.componentInstance.enviar();
    expect(emitido).toBeFalse();
  });

  // Valida la normalización: el nombre se recorta y una descripción de solo espacios se envía como undefined.
  it('enviar_recortaElNombreYOmiteDescripcionVacia', () => {
    const fixture = TestBed.createComponent(RolProcesoFormComponent);
    fixture.detectChanges();
    let emitido: unknown;
    fixture.componentInstance.guardar.subscribe((v) => (emitido = v));
    fixture.componentInstance.form.setValue({ nombre: ' Gerente ', descripcion: '  ' });
    fixture.componentInstance.enviar();
    expect(emitido).toEqual({ nombre: 'Gerente', descripcion: undefined });
  });

  // Valida el modo edición: al recibir el input [rol], el formulario se precarga con sus datos.
  it('conRol_precargaElFormulario', () => {
    const fixture = TestBed.createComponent(RolProcesoFormComponent);
    fixture.componentRef.setInput('rol', libre);
    fixture.detectChanges();
    expect(fixture.componentInstance.form.getRawValue().nombre).toBe('Analista');
  });

  // Valida que el botón Cancelar emite el evento cancelar hacia la página padre.
  it('cancelar_emiteElEvento', () => {
    const fixture = TestBed.createComponent(RolProcesoFormComponent);
    fixture.detectChanges();
    let cancelado = false;
    fixture.componentInstance.cancelar.subscribe(() => (cancelado = true));
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('#btnCancelarRol')?.click();
    expect(cancelado).toBeTrue();
  });
});
