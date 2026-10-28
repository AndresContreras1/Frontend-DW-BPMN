// Modelos de empresa (tenant). Registrar una empresa crea al mismo tiempo su primer administrador.
// Formulario público de registro: datos de la empresa más las credenciales de su administrador.
export interface RegistroEmpresaRequest {
  nombreEmpresa: string;
  nit: string;
  correoContacto: string;
  nombreAdmin: string;
  emailAdmin: string;
  // Contraseña inicial del administrador (el backend exige mínimo 8 caracteres).
  passwordAdmin: string;
}

// Empresa registrada. fechaRegistro llega como texto ISO (string), no como Date, porque JSON no tiene tipo fecha.
export interface EmpresaResponse {
  id: number;
  nombre: string;
  nit: string;
  correoContacto: string;
  fechaRegistro: string;
}
