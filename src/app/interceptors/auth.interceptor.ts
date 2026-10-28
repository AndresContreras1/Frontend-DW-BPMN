import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { TokenService } from '../service/token.service';

/** Agrega Authorization: Bearer solo a las peticiones dirigidas al backend. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenService).obtenerToken();
  if (token && req.url.startsWith(environment.apiUrl)) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
