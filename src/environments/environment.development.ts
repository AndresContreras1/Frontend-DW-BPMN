// Configuración de DESARROLLO (backend local). Sustituye a environment.ts durante ng serve.
// production: false habilita comportamientos de desarrollo; apiUrl apunta al backend en localhost.
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1'
};
