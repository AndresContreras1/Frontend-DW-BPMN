import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolAcceso } from '../models/enums.model';
import { AuthService } from '../service/auth.service';
import { NotificacionService } from '../service/notificacion.service';

/** Exige que el rol de acceso del usuario esté en route.data['roles']. */
export const rolGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.autenticado()) {
    return router.createUrlTree(['/login']);
  }
  const roles = (route.data['roles'] as RolAcceso[] | undefined) ?? [];
  if (auth.tieneRol(...roles)) {
    return true;
  }
  inject(NotificacionService).error('No tienes permisos para entrar a esa sección.');
  return router.createUrlTree(['/procesos']);
};
