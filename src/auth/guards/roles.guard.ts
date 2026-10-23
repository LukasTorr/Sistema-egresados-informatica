import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolCuenta } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { UsuarioToken } from '../../common/decorators/usuario-actual.decorator';

/** Permite el acceso solo a los roles indicados con @Roles(...). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<RolCuenta[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const usuario: UsuarioToken | undefined = context.switchToHttp().getRequest().user;
    if (!usuario || !roles.includes(usuario.rol)) {
      throw new ForbiddenException('Tu rol no tiene permiso para esta acción');
    }
    return true;
  }
}
