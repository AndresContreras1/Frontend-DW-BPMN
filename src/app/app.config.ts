// Configuración global de la aplicación (providers). Con componentes standalone no existe
// AppModule: todo lo que antes se declaraba en módulos se registra aquí con funciones provide*.
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { routes } from './app.routes';

// Se pasa a bootstrapApplication en main.ts.
export const appConfig: ApplicationConfig = {
  providers: [
    // Detección de cambios con zone.js; eventCoalescing agrupa eventos del DOM seguidos para evitar ciclos de detección innecesarios.
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Registra las rutas definidas en app.routes.ts.
    provideRouter(routes),
    // Habilita HttpClient. El orden en withInterceptors importa: primero se agrega el token (auth) y al volver la respuesta se manejan los errores (error).
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
  ]
};
