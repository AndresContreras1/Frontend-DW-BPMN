// Punto de entrada: arranca la aplicación Angular con el componente raíz y la configuración global.
// bootstrapApplication es el arranque sin NgModule (componentes standalone).
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// El catch muestra en consola cualquier error que ocurra durante el arranque.
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
