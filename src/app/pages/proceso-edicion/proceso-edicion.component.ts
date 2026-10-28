// Página para crear (/procesos/nuevo, HU-04) y editar (/procesos/:id/editar, HU-05) los datos de un proceso con el MISMO formulario.
// La ruta decide el modo: si no hay :id en la URL es creación; si hay, es edición. Ambas rutas usan rolGuard con roles de acceso ADMINISTRADOR/EDITOR.
// Conceptos: ActivatedRoute.snapshot.params, navegación con Router tras guardar, errores por campo (400) y estrategia pesimista (se navega solo al confirmar el backend).
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EstadoProcesoComponent } from '../../components/estado-proceso/estado-proceso.component';
import { ProcesoFormComponent } from '../../components/proceso-form/proceso-form.component';
import { SpinnerCargaComponent } from '../../components/spinner-carga/spinner-carga.component';
import { ProcesoRequest, ProcesoResponse } from '../../models/proceso.model';
import { NotificacionService } from '../../service/notificacion.service';
import { ProcesoService } from '../../service/proceso.service';
import { erroresPorCampo, mensajeDeError } from '../../utils/problema';

/** HU-04 y HU-05: crear (procesos/nuevo) y editar (procesos/:id/editar) con el mismo formulario. */
@Component({
  selector: 'app-proceso-edicion',
  imports: [RouterLink, ProcesoFormComponent, EstadoProcesoComponent, SpinnerCargaComponent],
  templateUrl: './proceso-edicion.component.html'
})
/** Página contenedora ("inteligente"): el formulario en sí es el componente hijo app-proceso-form; esta clase habla con el backend y navega. */
export class ProcesoEdicionComponent implements OnInit {
  /** Servicio HTTP de procesos (obtener, crear, editar). */
  private readonly procesoService = inject(ProcesoService);
  /** Router para navegar tras guardar o cancelar. */
  private readonly router = inject(Router);
  /** Toast de éxito. */
  private readonly notificaciones = inject(NotificacionService);
  /** Parámetros de la ruta en el momento de crear la página (snapshot). */
  private readonly params = inject(ActivatedRoute).snapshot.params;

  /** null = modo creación (no hay :id en la URL); número = modo edición. */
  readonly id: number | null = this.params['id'] === undefined ? null : Number(this.params['id']);
  /** Proceso cargado para editar (null en creación o mientras carga). */
  readonly proceso = signal<ProcesoResponse | null>(null);
  /** Solo se inicia en true en edición, porque hay que traer el proceso antes de mostrar el formulario. */
  readonly cargando = signal(this.id !== null);
  /** Signal: guardado en curso (el formulario hijo bloquea su botón). */
  readonly enviando = signal(false);
  /** Mensaje general de error (alerta). */
  readonly error = signal('');
  /** Errores por campo del backend (400) que se pasan al formulario hijo. */
  readonly errores = signal<Record<string, string | undefined>>({});

  /** En creación no hay nada que cargar. En edición pide el proceso por id (un 404 o 403 muestra el error y deja el enlace de volver). */
  ngOnInit(): void {
    if (this.id === null) {
      return;
    }
    this.procesoService.obtener(this.id).subscribe({
      next: (detalle) => {
        this.proceso.set(detalle.proceso);
        this.cargando.set(false);
      },
      // Fallo: errores por campo (400 de validación) al formulario y mensaje general (409 nombre repetido, 403, 404...).
      error: (e: unknown) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(e));
      }
    });
  }

  /**
   * Recibe los datos válidos del formulario hijo (output guardar). Elige la petición según el modo: crear (POST) o editar (PUT).
   * Pesimista: solo al confirmar el backend se notifica y se navega al detalle.
   */
  guardar(datos: ProcesoRequest): void {
    this.enviando.set(true);
    this.error.set('');
    this.errores.set({});
    // Observable frío: no se ejecuta hasta el subscribe.
    const peticion = this.id === null ? this.procesoService.crear(datos) : this.procesoService.editar(this.id, datos);
    peticion.subscribe({
      // Éxito: navega a /procesos/:id con el id devuelto por el backend (útil en creación, donde el id acaba de generarse).
      next: (guardado) => {
        this.enviando.set(false);
        this.notificaciones.exito(this.id === null ? 'Proceso creado.' : 'Cambios guardados.');
        void this.router.navigate(['/procesos', guardado.id]);
      },
      error: (e: unknown) => {
        this.enviando.set(false);
        this.errores.set(erroresPorCampo(e));
        this.error.set(mensajeDeError(e));
      }
    });
  }

  /** Salir sin guardar: en creación vuelve a la lista; en edición, al detalle del proceso. */
  cancelar(): void {
    void this.router.navigate(this.id === null ? ['/procesos'] : ['/procesos', this.id]);
  }

  /** Handler de (cambiado) del selector de estado: el backend ya confirmó, se refresca el proceso mostrado. */
  alCambiarEstado(actualizado: ProcesoResponse): void {
    this.proceso.set(actualizado);
  }
}
