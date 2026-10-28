// Tabla de rutas de la aplicación (SPA). Cada ruta enlaza una URL con un componente standalone
// y, si hace falta, con guards. Las rutas públicas no llevan guard; las privadas usan authGuard
// (solo sesión) o rolGuard (sesión + rol permitido, declarado en data.roles).
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { rolGuard } from './guards/rol.guard';
import { CompartidoDetalleComponent } from './pages/compartido-detalle/compartido-detalle.component';
import { CompartidosComponent } from './pages/compartidos/compartidos.component';
import { EditorProcesoComponent } from './pages/editor-proceso/editor-proceso.component';
import { InvitacionComponent } from './pages/invitacion/invitacion.component';
import { LoginComponent } from './pages/login/login.component';
import { NoEncontradaComponent } from './pages/no-encontrada/no-encontrada.component';
import { PermisosComponent } from './pages/permisos/permisos.component';
import { ProcesoDetalleComponent } from './pages/proceso-detalle/proceso-detalle.component';
import { ProcesoEdicionComponent } from './pages/proceso-edicion/proceso-edicion.component';
import { ProcesosComponent } from './pages/procesos/procesos.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { RolesComponent } from './pages/roles/roles.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';

// Routes es el tipo de Angular para este arreglo; el router evalúa las rutas en orden y usa la primera que coincide.
export const routes: Routes = [
  // Redirección de la raíz: pathMatch "full" evita que coincida con todas las URL.
  { path: '', pathMatch: 'full', redirectTo: 'procesos' },
  // Rutas públicas: no requieren sesión.
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'invitacion/:token', component: InvitacionComponent },
  // Listado: cualquier usuario autenticado (authGuard).
  { path: 'procesos', component: ProcesosComponent, canActivate: [authGuard] },
  // Las rutas específicas van antes que procesos/:id.
  // Crear/editar/diseñar procesos exige rol ADMINISTRADOR o EDITOR; SOLO_LECTURA solo puede consultar.
  { path: 'procesos/nuevo', component: ProcesoEdicionComponent, canActivate: [rolGuard], data: { roles: ['ADMINISTRADOR', 'EDITOR'] } },
  { path: 'procesos/:id/editar', component: ProcesoEdicionComponent, canActivate: [rolGuard], data: { roles: ['ADMINISTRADOR', 'EDITOR'] } },
  { path: 'procesos/:id/editor', component: EditorProcesoComponent, canActivate: [rolGuard], data: { roles: ['ADMINISTRADOR', 'EDITOR'] } },
  // Detalle (solo consulta): ":id" es un parámetro de ruta que el componente lee. Va después de las rutas más específicas.
  { path: 'procesos/:id', component: ProcesoDetalleComponent, canActivate: [authGuard] },
  // Procesos compartidos con la empresa: visibles para cualquier usuario autenticado.
  { path: 'compartidos', component: CompartidosComponent, canActivate: [authGuard] },
  { path: 'compartidos/:id', component: CompartidoDetalleComponent, canActivate: [authGuard] },
  // Administración (roles de proceso, usuarios y permisos): solo ADMINISTRADOR.
  { path: 'roles', component: RolesComponent, canActivate: [rolGuard], data: { roles: ['ADMINISTRADOR'] } },
  { path: 'usuarios', component: UsuariosComponent, canActivate: [rolGuard], data: { roles: ['ADMINISTRADOR'] } },
  { path: 'permisos', component: PermisosComponent, canActivate: [rolGuard], data: { roles: ['ADMINISTRADOR'] } },
  // Comodín: debe ir al final; muestra la página 404 para cualquier URL desconocida.
  { path: '**', component: NoEncontradaComponent }
];

