import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { rolGuard } from './guards/rol.guard';
import { CompartidoDetalleComponent } from './pages/compartido-detalle/compartido-detalle.component';
import { CompartidosComponent } from './pages/compartidos/compartidos.component';
import { InvitacionComponent } from './pages/invitacion/invitacion.component';
import { LoginComponent } from './pages/login/login.component';
import { NoEncontradaComponent } from './pages/no-encontrada/no-encontrada.component';
import { PermisosComponent } from './pages/permisos/permisos.component';
import { ProcesoDetalleComponent } from './pages/proceso-detalle/proceso-detalle.component';
import { ProcesoEdicionComponent } from './pages/proceso-edicion/proceso-edicion.component';
import { ProcesosComponent } from './pages/procesos/procesos.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'procesos' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'invitacion/:token', component: InvitacionComponent },
  { path: 'procesos', component: ProcesosComponent, canActivate: [authGuard] },
  // Las rutas específicas van antes que procesos/:id.
  { path: 'procesos/nuevo', component: ProcesoEdicionComponent, canActivate: [rolGuard], data: { roles: ['ADMINISTRADOR', 'EDITOR'] } },
  { path: 'procesos/:id/editar', component: ProcesoEdicionComponent, canActivate: [rolGuard], data: { roles: ['ADMINISTRADOR', 'EDITOR'] } },
  { path: 'procesos/:id', component: ProcesoDetalleComponent, canActivate: [authGuard] },
  { path: 'compartidos', component: CompartidosComponent, canActivate: [authGuard] },
  { path: 'compartidos/:id', component: CompartidoDetalleComponent, canActivate: [authGuard] },
  { path: 'usuarios', component: UsuariosComponent, canActivate: [rolGuard], data: { roles: ['ADMINISTRADOR'] } },
  { path: 'permisos', component: PermisosComponent, canActivate: [rolGuard], data: { roles: ['ADMINISTRADOR'] } },
  { path: '**', component: NoEncontradaComponent }
];

