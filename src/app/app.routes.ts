import { Routes } from '@angular/router';
import { InicioComponent } from './pages/inicio/inicio.component';
import { NoEncontradaComponent } from './pages/no-encontrada/no-encontrada.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: '**', component: NoEncontradaComponent }
];
