# Frontend-DW-BPMN

Frontend en **Angular 19** del visor y editor de procesos BPMN multiempresa (proyecto semestral de Desarrollo Web, entregas 1 y 2).
Consume el backend REST de Spring Boot (`/api/v1`, autenticación JWT) del repositorio `Backend-DW-BPMN`.

Permite registrar una empresa, invitar usuarios, administrar procesos y roles de proceso, y dibujar y editar el diagrama de cada proceso
(pools, lanes, actividades, gateways, eventos de mensaje, arcos y mensajes entre pools) con un SVG propio, sin librerías de BPMN.

> El sistema **solo modela**: las notificaciones a sistemas externos y los mensajes entre pools se describen, nunca se envían.

## Requisitos

- Node 22 o superior y npm
- Backend corriendo en `http://localhost:8080` (por defecto con H2 y datos de ejemplo; ver el README del backend)
- Docker (opcional, para `compose.yaml`)

## Cómo correrlo

```bash
npm ci
npm start
```

La aplicación queda en `http://localhost:4200`. El backend debe permitir ese origen (`CORS_ALLOWED_ORIGINS`, por defecto `http://localhost:4200`).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo (`ng serve`) |
| `npm run build` | Compilación en `dist/frontend-dw-bpmn/browser` |
| `npm test` | Pruebas Karma/Jasmine en modo observación |
| `npm run test:ci` | Pruebas sin interfaz y con cobertura (`coverage/frontend-dw-bpmn/lcov.info`) |

## Variables de entorno de Angular

La URL del backend está en `src/environments/environment.development.ts` (desarrollo) y `src/environments/environment.ts` (producción),
propiedad `apiUrl` (`http://localhost:8080/api/v1`). Se cambia ahí y se vuelve a compilar.

## Estructura

```
src/app/
  components/    componentes reutilizables (navbar, paginador, modal, campo de formulario, diagrama, formularios del editor...)
  models/        interfaces con los mismos nombres que los DTOs del backend
  pages/         páginas enlazadas a rutas
  service/       servicios con HttpClient (un servicio por grupo de endpoints) y estado compartido (sesión, avisos)
  interceptors/  token Bearer y manejo de errores 401/403
  guards/        guards de sesión y de rol
  utils/         funciones puras (cálculo del diagrama, advertencias del modelo, lectura de ProblemDetail)
  testing/       datos y ayudas de las pruebas
src/environments/  URL base del backend
src/styles/        paleta aguamarina (_variables.scss)
```

## Rutas y roles

El **rol de acceso** del usuario (`ADMINISTRADOR`, `EDITOR`, `SOLO_LECTURA`) define qué puede hacer en la aplicación.
No es el *rol de proceso* (la responsabilidad que nombra una lane, por ejemplo "Gerente").

| Ruta | Quién | Qué hay |
|---|---|---|
| `/login`, `/registro`, `/invitacion/:token` | público | HU-03, HU-01, HU-02 (aceptar invitación) |
| `/procesos` | sesión iniciada | HU-04: búsqueda, filtros por estado, categoría y eliminados, paginación |
| `/procesos/nuevo`, `/procesos/:id/editar` | admin y editor | HU-04 y HU-05: mismo formulario para crear y editar |
| `/procesos/:id` | sesión iniciada | HU-07: detalle, diagrama SVG, historial; estado y advertencias al publicar; compartir (solo admin) |
| `/procesos/:id/editor` | admin y editor | HU-08 a HU-22 y HU-25 a HU-28: edición del diagrama |
| `/compartidos`, `/compartidos/:id` | sesión iniciada | HU-23: procesos que otra empresa compartió, en solo lectura |
| `/roles` | admin | HU-17 a HU-20: roles de proceso, con validación de uso |
| `/usuarios` | admin | HU-02: invitar, cambiar rol de acceso, desactivar |
| `/permisos` | admin | HU-24: permisos de estructura (pools y lanes) por rol de acceso |
| `**` | todos | Página no encontrada |

Eliminar (procesos, pools, lanes, actividades, gateways, arcos, eventos y mensajes) solo lo ofrece la interfaz al administrador, igual que el backend.

## Sesión

`POST /auth/login` devuelve un JSON con `accessToken` y el usuario; se guardan en `localStorage`. Un interceptor funcional agrega
`Authorization: Bearer` solo a las peticiones dirigidas a `environment.apiUrl`. Ante un 401 se limpia la sesión y se envía a `/login`;
ante un 403 se avisa con el mensaje del backend. El token dura 30 minutos y no hay renovación.

## Docker

El `Dockerfile` es multi-etapa (compila con Node y sirve con nginx; `nginx.conf` usa `try_files` para el router de Angular).

```bash
docker build -t frontend-dw-bpmn .
docker run --rm -p 4200:80 frontend-dw-bpmn
```

`compose.yaml` levanta PostgreSQL 16, el backend (construido desde la carpeta hermana `../Backend-DW-BPMN`) y el frontend:

```bash
cp .env.example .env      # completar DB_PASSWORD y JWT_SECRET (mínimo 32 caracteres)
docker compose up -d --build
```

Frontend en `http://localhost:4200` y backend en `http://localhost:8080`. `CORS_ALLOWED_ORIGINS` debe coincidir con el origen del frontend.
El backend en perfil `prod` no crea datos de ejemplo: se empieza registrando una empresa en `/registro`.
El archivo `.env` está en `.gitignore`.

## Calidad

- Pruebas Karma/Jasmine de servicios (con `HttpTestingController`), interceptores, guards, utilidades, componentes y páginas.
- El CI (`.github/workflows/ci.yml`) compila, corre las pruebas con cobertura, envía el análisis a SonarCloud (`sonar-project.properties`)
  y construye la imagen Docker. Requiere el secreto `SONAR_TOKEN` en GitHub.
- Ids estables y descriptivos en formularios, botones y listas (`btnIngresar`, `txtNombre`, `btnNuevoProceso`...) para pruebas de interfaz.

## Notas de integración con el backend

- Las listas paginadas (`/procesos` y `/roles/consulta`) reciben el parámetro `pagina` (desde 0) y devuelven páginas de 10 elementos.
- Un error 400 trae en `detail` el formato `campo: mensaje; campo: mensaje`; la interfaz lo separa por campo y lo muestra bajo cada entrada.
- Publicar un proceso devuelve 409 con el primer incumplimiento del modelo; el panel de advertencias del editor adelanta las reglas conocidas.
- El nombre de un mensaje debe coincidir con el de su evento Message Throw; el formulario lo propone al elegir el evento.
