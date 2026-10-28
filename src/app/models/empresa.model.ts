export interface RegistroEmpresaRequest {
  nombreEmpresa: string;
  nit: string;
  correoContacto: string;
  nombreAdmin: string;
  emailAdmin: string;
  passwordAdmin: string;
}

export interface EmpresaResponse {
  id: number;
  nombre: string;
  nit: string;
  correoContacto: string;
  fechaRegistro: string;
}
