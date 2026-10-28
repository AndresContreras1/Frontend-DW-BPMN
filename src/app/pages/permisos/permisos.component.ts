import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SpinnerCargaComponent } from '../../components/spinner-carga/spinner-carga.component';
import { ROLES_ACCESO, RolAcceso } from '../../models/enums.model';
import { PermisoEstructuraResponse } from '../../models/permiso-estructura.model';
import { NotificacionService } from '../../service/notificacion.service';
import { PermisoEstructuraService } from '../../service/permiso-estructura.service';
import { mensajeDeError } from '../../utils/problema';

type FormPermisos = FormGroup<{
  crearPool: FormControl<boolean>;
  editarPool: FormControl<boolean>;
  eliminarPool: FormControl<boolean>;
  crearLane: FormControl<boolean>;
  editarLane: FormControl<boolean>;
  eliminarLane: FormControl<boolean>;
}>;

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
export class PermisosComponent implements OnInit {
  private readonly permisoService = inject(PermisoEstructuraService);
  private readonly notificaciones = inject(NotificacionService);

  readonly filas = signal<FilaPermisos[]>([]);
  readonly cargando = signal(true);
  readonly guardando = signal<RolAcceso | null>(null);

  ngOnInit(): void {
    this.permisoService.listar().subscribe({
      next: (permisos) => {
        this.filas.set(permisos.map((p) => this.crearFila(p)));
        this.cargando.set(false);
      },
      error: (e: unknown) => {
        this.cargando.set(false);
        this.notificaciones.error(mensajeDeError(e));
      }
    });
  }

  etiquetaRol(rol: RolAcceso): string {
    return ROLES_ACCESO.find((r) => r.valor === rol)?.etiqueta ?? rol;
  }

  guardar(fila: FilaPermisos): void {
    this.guardando.set(fila.rolAcceso);
    this.permisoService.actualizar(fila.rolAcceso, fila.form.getRawValue()).subscribe({
      next: (guardado) => {
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

  private crearFila(p: PermisoEstructuraResponse): FilaPermisos {
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
