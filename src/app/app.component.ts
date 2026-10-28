// Componente raíz (<app-root>). Define el esqueleto de toda la aplicación: barra de navegación,
// notificaciones, contenido de la ruta activa y pie de página.
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './components/footer/footer.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ToastsComponent } from './components/toasts/toasts.component';

// Componente standalone: en lugar de declararse en un NgModule, importa directamente lo que su plantilla usa.
// RouterOutlet pinta el componente de la ruta activa; los demás son componentes propios del layout.
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
// Sin lógica propia: solo compone el layout, por eso la clase está vacía.
export class AppComponent {}
