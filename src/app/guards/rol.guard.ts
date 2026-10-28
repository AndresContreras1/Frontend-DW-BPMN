// Guard funcional de autorización por rol: además de exigir sesión, comprueba que el rol del
// usuario esté permitido. Los roles de cada ruta se declaran en su "data" (ver app.routes.ts).
// Es una barrera de experiencia de usuario; la seguridad real la aplica el backend.
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RolAcceso } from '../models/enums.model';
import { AuthService } from '../service/auth.service';
import { NotificacionService } from '../service/notificacion.service';

// Recibe la ruta (route) para leer su configuración. Reutilizable: cada ruta indica sus propios roles.
/** Exige que el rol de acceso del usuario esté en route.data['roles']. */
export const rolGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.autenticado()) {
    return router.createUrlTree(['/login']);
  }
  // Si la ruta no declara roles se usa una lista vacía, de modo que se niega el acceso por defecto (fallar cerrado es más seguro).
  const roles = (route.data['roles'] as RolAcceso[] | undefined) ?? [];
  if (auth.tieneRol(...roles)) {
    return true;
  }
  // inject() se llama sincrónicamente dentro del guard (aún en contexto de inyección) y solo cuando hace falta avisar.
  inject(NotificacionService).error('No tienes permisos para entrar a esa sección.');
  return router.createUrlTree(['/procesos']);
};
