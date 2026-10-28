// Forma del error estándar que devuelve el backend (RFC 7807 / Spring ProblemDetail).
// Centralizar el tipo permite que un solo helper (utils/problema.ts) interprete todos los errores.
// Cuerpo application/problem+json que devuelve el backend en los errores.
// Todos los campos son opcionales porque el backend puede omitir cualquiera según el tipo de error.
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  // Mensaje legible para el usuario; en validaciones (400) suele ser "campo: mensaje; campo: mensaje".
  detail?: string;
  instance?: string;
  // Alternativa al detail: mapa campo -> mensaje (Record<string, string>).
  errors?: Record<string, string>;
}
