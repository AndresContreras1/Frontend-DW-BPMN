# Frontend-DW-BPMN

Frontend en Angular 19 del visor y editor de procesos BPMN multiempresa (proyecto semestral de Desarrollo Web).
Consume el backend REST de Spring Boot (`/api/v1`, autenticación JWT).

## Requisitos

- Node 22 o superior y npm
- Backend corriendo en `http://localhost:8080` (repositorio `Backend-DW-BPMN`)

## Cómo correrlo

```bash
npm ci
npm start
```

La aplicación queda en `http://localhost:4200`. La URL del backend está en
`src/environments/environment.development.ts` (desarrollo) y `src/environments/environment.ts` (producción), propiedad `apiUrl`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo (`ng serve`) |
| `npm run build` | Compilación de producción en `dist/` |
| `npm test` | Pruebas Karma/Jasmine |
| `npx ng test --watch=false --browsers=ChromeHeadless --code-coverage` | Pruebas sin interfaz con cobertura (`coverage/frontend-dw-bpmn/lcov.info`) |

## Estructura

```
src/app/
  components/    componentes reutilizables (navbar, footer, ...)
  models/        interfaces iguales a los DTOs del backend
  pages/         páginas enlazadas a rutas
  service/       servicios con HttpClient
  interceptors/  interceptores HTTP
  guards/        guards de ruta
src/environments/  URL base del backend
src/styles/        paleta aguamarina (_variables.scss)
```

## Estilos

Bootstrap 5.3.8 instalado por npm y personalizado por SCSS: las variables de `src/styles/_variables.scss`
se pasan a Bootstrap antes de importarlo y el CSS propio va después, en `src/styles.scss`.

## Calidad

El CI (`.github/workflows/ci.yml`) compila, ejecuta las pruebas con cobertura y envía el análisis a SonarCloud
(`sonar-project.properties`). Requiere el secreto `SONAR_TOKEN` en GitHub.
