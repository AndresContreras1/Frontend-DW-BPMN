// Interceptor funcional de autenticación: agrega el token JWT a las peticiones al backend.
// En Angular moderno los interceptores son funciones (HttpInterceptorFn) registradas con
// withInterceptors() en app.config.ts, en lugar de clases con HTTP_INTERCEPTORS.
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { TokenService } from '../service/token.service';

// inject() funciona aquí porque el interceptor se ejecuta dentro de un contexto de inyección.
// Las peticiones (HttpRequest) son inmutables: para modificar encabezados hay que clonarlas con req.clone().
/** Agrega Authorization: Bearer solo a las peticiones dirigidas al backend. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenService).obtenerToken();
  // El token solo se envía si la URL empieza por la del backend: evita filtrar la credencial a servicios de terceros.
  if (token && req.url.startsWith(environment.apiUrl)) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  // Sin token o con URL ajena, la petición sigue sin modificarse.
  return next(req);
};
