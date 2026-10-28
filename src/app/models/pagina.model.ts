// Envoltorio genérico de las respuestas paginadas del backend (Page de Spring).
// El genérico <T> permite reutilizar la misma forma para cualquier lista paginada (PageResponse<ProcesoResponse>, etc.).
export interface PageResponse<T> {
  // Elementos de la página actual.
  content: T[];
  // Número de página (base 0).
  page: number;
  size: number;
  // Total de registros en todas las páginas; totalPages sirve para dibujar el paginador.
  totalElements: number;
  totalPages: number;
}
