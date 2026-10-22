export type RolUsuario =
  | 'secretaria'
  | 'jefe_carrera'
  | 'docente'
  | 'jefe_comision_evaluacion'
  | 'egresado';

export interface CredencialesLogin {
  rut: string;
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
  telefono?: string;
  empresa?: string;
  cargo?: string;
  rangoSueldo?: string;
}

/** Datos editables desde "Mi perfil" (todo excepto rut, correo institucional y rol). */
export interface PerfilEditable {
  nombres: string;
  apellidos: string;
  telefono?: string;
  empresa?: string;
  cargo?: string;
  rangoSueldo?: string;
}
