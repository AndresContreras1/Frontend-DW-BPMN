// Página /permisos (HU-24): matriz de permisos de ESTRUCTURA (crear/editar/eliminar pools y lanes) por rol de ACCESO.
// Ruta protegida con rolGuard: solo ADMINISTRADOR. Estos permisos los usa el editor del diagrama para habilitar o no los botones de pools y lanes.
// Conceptos: un FormGroup por fila (un rol de acceso) dentro de un signal, guardado por fila con estrategia pesimista
// (form.reset(valorGuardado) solo cuando el backend confirma, lo que además deja el formulario "limpio" y desactiva Guardar).
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SpinnerCargaComponent } from '../../components/spinner-carga/spinner-carga.component';
import { ROLES_ACCESO, RolAcceso } from '../../models/enums.model';
import { PermisoEstructuraResponse } from '../../models/permiso-estructura.model';
import { NotificacionService } from '../../service/notificacion.service';
import { PermisoEstructuraService } from '../../service/permiso-estructura.service';
import { mensajeDeError } from '../../utils/problema';

/** Tipo del formulario de una fila: seis casillas booleanas (crear/editar/eliminar para pool y lane). */
type FormPermisos = FormGroup<{
  crearPool: FormControl<boolean>;
  editarPool: FormControl<boolean>;
  eliminarPool: FormControl<boolean>;
  crearLane: FormControl<boolean>;
  editarLane: FormControl<boolean>;
  eliminarLane: FormControl<boolean>;
}>;

/** Una fila de la matriz: el rol de acceso y su propio formulario reactivo. */
interface FilaPermisos {
  rolAcceso: RolAcceso;
  form: FormPermisos;
}

/** HU-24: matriz de permisos de estructura (pools y lanes) por rol de acceso. */
@Component({
  selector: 'app-permisos',
  imports: [ReactiveFormsModule, RouterLink, SpinnerCargaComponent],
  templateUrl: './permisos.component.html'
})
/** Página de la matriz de permisos de estructura. */
export class PermisosComponent implements OnInit {
  /** Servicio HTTP de permisos de estructura (listar, actualizar por rol). */
  private readonly permisoService = inject(PermisoEstructuraService);
  /** Toasts. */
  private readonly notificaciones = inject(NotificacionService);

  /** Signal con una fila por rol de acceso, cada una con su FormGroup. */
  readonly filas = signal<FilaPermisos[]>([]);
  /** Signal: spinner mientras se piden los permisos. */
  readonly cargando = signal(true);
  /** Rol cuyo guardado está en curso (null = ninguno); bloquea todos los botones Guardar mientras tanto. */
  readonly guardando = signal<RolAcceso | null>(null);

  /** Carga los permisos y construye un formulario por cada fila recibida. */
  ngOnInit(): void {
    this.permisoService.listar().subscribe({
      next: (permisos) => {
        this.filas.set(permisos.map((p) => this.crearFila(p)));
        this.cargando.set(false);
      },
      // Fallo al cargar (401/403/500...): apaga el spinner y avisa con el mensaje del ProblemDetail.
      error: (e: unknown) => {
        this.cargando.set(false);
        this.notificaciones.error(mensajeDeError(e));
      }
    });
  }

  /** Valor técnico del rol -> etiqueta legible. */
  etiquetaRol(rol: RolAcceso): string {
    return ROLES_ACCESO.find((r) => r.valor === rol)?.etiqueta ?? rol;
  }

  /** Envía al backend los seis permisos de UNA fila (getRawValue()). El rol identifica qué registro se actualiza. */
  guardar(fila: FilaPermisos): void {
    this.guardando.set(fila.rolAcceso);
    this.permisoService.actualizar(fila.rolAcceso, fila.form.getRawValue()).subscribe({
      next: (guardado) => {
        // Éxito: se reinicia el formulario con lo que devolvió el backend; así queda "pristine" y el botón Guardar se vuelve a deshabilitar.
        fila.form.reset(guardado);
        this.guardando.set(null);
        this.notificaciones.exito('Permisos de ' + this.etiquetaRol(guardado.rolAcceso) + ' guardados.');
      },
      error: (e: unknown) => {
        this.guardando.set(null);
        this.notificaciones.error(mensajeDeError(e));
      }
    });
  }

  /** Convierte la respuesta del backend de un rol en una fila con su FormGroup de seis casillas. */
  private crearFila(p: PermisoEstructuraResponse): FilaPermisos {
    // Fábrica de controles booleanos no nulos.
    const control = (valor: boolean) => new FormControl(valor, { nonNullable: true });
    return {
      rolAcceso: p.rolAcceso,
      form: new FormGroup({
        crearPool: control(p.crearPool),
        editarPool: control(p.editarPool),
        eliminarPool: control(p.eliminarPool),
        crearLane: control(p.crearLane),
        editarLane: control(p.editarLane),
        eliminarLane: control(p.eliminarLane)
      })
    };
  }
}
