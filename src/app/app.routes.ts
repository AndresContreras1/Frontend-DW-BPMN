import { Routes } from '@angular/router';
import { rolGuard } from './guards/rol.guard';
import { InvitacionComponent } from './pages/invitacion/invitacion.component';
import { LoginComponent } from './pages/login/login.component';
import { NoEncontradaComponent } from './pages/no-encontrada/no-encontrada.component';
import { PermisosComponent } from './pages/permisos/permisos.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'procesos' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'invitacion/:token', component: InvitacionComponent },
  { path: 'usuarios', component: UsuariosComponent, canActivate: [rolGuard], data: { roles: ['ADMINISTRADOR'] } },
  { path: 'permisos', component: PermisosComponent, canActivate: [rolGuard], data: { roles: ['ADMINISTRADOR'] } },
  { path: '**', component: NoEncontradaComponent }
];

