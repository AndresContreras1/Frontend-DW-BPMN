// Guard funcional de autenticación (CanActivateFn): protege rutas que exigen sesión iniciada.
// Los guards funcionales reemplazan a las clases que implementaban CanActivate.
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

// Devuelve true para permitir el paso o un UrlTree para redirigir; devolver un UrlTree es la forma recomendada
// de redirigir desde un guard (en lugar de llamar router.navigate).
/** Solo deja pasar a usuarios con sesión iniciada. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.autenticado() ? true : router.createUrlTree(['/login']);
};
