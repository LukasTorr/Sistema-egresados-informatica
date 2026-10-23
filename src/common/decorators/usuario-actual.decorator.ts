import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RolCuenta } from '@prisma/client';

/** Datos que viajan dentro del token JWT. */
export interface UsuarioToken {
  sub: number; // id_cuenta
  correo: string;
  rol: RolCuenta;
  id_egresado?: number;
  id_funcionario?: number;
}

/** Inyecta en el controlador el usuario autenticado. */
export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioToken =>
    ctx.switchToHttp().getRequest().user,
);
