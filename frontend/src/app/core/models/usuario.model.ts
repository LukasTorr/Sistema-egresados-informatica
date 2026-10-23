export type RolUsuario =
  | 'secretaria'
  | 'jefe_carrera'
  | 'docente'
  | 'jefe_comision_evaluacion'
  | 'egresado';

export type RolCuenta = 'ADMINISTRADOR' | 'FUNCIONARIO' | 'EGRESADO';

export interface CredencialesLogin {
  correo: string;
  clave: string;
}

export interface RegistroUsuario {
  nombres: string;
  apellidos: string;
  rut: string;
  correo: string;
  telefono?: string;
  clave: string;
  claveConfirmacion: string;
}

export interface UsuarioAutenticado {
  id: string;
  nombres: string;
  apellidos: string;
  rut: string;
  correo: string;
  rol: RolUsuario;
  rolCuenta?: RolCuenta;
  token?: string;
  idEgresado?: number;
  idFuncionario?: number;
  telefono?: string;
  empresa?: string;
  cargo?: string;
  rangoSueldo?: string;
}

export interface PerfilEditable {
  nombres: string;
  apellidos: string;
  telefono?: string;
  empresa?: string;
  cargo?: string;
  rangoSueldo?: string;
}
