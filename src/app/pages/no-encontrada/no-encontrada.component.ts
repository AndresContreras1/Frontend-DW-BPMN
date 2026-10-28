// Página 404 (ruta comodín "**"). Es el último path de app.routes.ts: si ninguna ruta anterior coincide,
// el Router carga este componente. No cubre una HU de negocio; es manejo de navegación inválida.
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Componente sin lógica: solo muestra un mensaje y un enlace (RouterLink) para volver al inicio. */
@Component({
  selector: 'app-no-encontrada',
  imports: [RouterLink],
  templateUrl: './no-encontrada.component.html',
  styleUrl: './no-encontrada.component.scss'
})
export class NoEncontradaComponent {}
