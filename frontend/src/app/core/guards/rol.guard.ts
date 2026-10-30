import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { RolUsuario } from '../models/usuario.model';
import { AuthService } from '../services/auth.service';

/**
 * Protege una zona de la app según el rol.
 * - Sin sesión: manda al login.
 * - Con sesión pero rol incorrecto: lo devuelve a la zona de su propio rol.
 */
export const rolGuard = (rolesPermitidos: RolUsuario[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const usuario = auth.usuarioActual();

    if (!usuario) {
      return router.createUrlTree(['/login']);
    }

    if (rolesPermitidos.includes(usuario.rol)) {
      return true;
    }

    return router.createUrlTree([auth.rutaInicio(usuario.rol)]);
  };
};

