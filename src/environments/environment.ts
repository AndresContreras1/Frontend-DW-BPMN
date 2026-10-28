// Configuración de PRODUCCIÓN. Angular reemplaza este archivo por environment.development.ts
// al compilar en desarrollo (fileReplacements en angular.json). Así el código siempre importa
// "environment" sin importar el ambiente.
// apiUrl es la URL base del backend; los servicios y el interceptor la usan para construir y reconocer las peticiones.
export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080/api/v1'
};
