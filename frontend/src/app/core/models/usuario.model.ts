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

export interface ActivacionCuenta {
  rut: string;
  correo: string;
  clave: string;
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
  debeCambiarContrasena?: boolean;
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
