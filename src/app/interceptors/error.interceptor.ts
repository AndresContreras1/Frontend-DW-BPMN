import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../service/auth.service';
import { NotificacionService } from '../service/notificacion.service';
import { mensajeDeError } from '../utils/problema';

/**
 * 401: la sesión no es válida (token vencido o ausente), se limpia y se envía a /login.
 * 403: se avisa que el rol no tiene permiso. El error se vuelve a lanzar para que el componente lo trate.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notificaciones = inject(NotificacionService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && req.url.startsWith(environment.apiUrl)) {
        const esLogin = req.url.endsWith('/auth/login');
        if (error.status === 401 && !esLogin) {
          auth.limpiarSesion();
          notificaciones.advertencia('Tu sesión terminó. Inicia sesión de nuevo.');
          void router.navigate(['/login']);
        } else if (error.status === 403) {
          notificaciones.error(mensajeDeError(error));
        }
      }
      return throwError(() => error);
    })
  );
};
