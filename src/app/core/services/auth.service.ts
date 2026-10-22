import { Injectable, computed, effect, signal } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import {
  CredencialesLogin,
  PerfilEditable,
  RegistroUsuario,
  RolUsuario,
  UsuarioAutenticado,
} from '../models/usuario.model';

const CLAVE_STORAGE = 'sse_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly usuarioActual = signal<UsuarioAutenticado | null>(null);

  /** Secretaría y Jefatura de carrera tienen permisos de administración. */
  readonly esAdmin = computed(() => {
    const rol = this.usuarioActual()?.rol;
    return rol === 'secretaria' || rol === 'jefe_carrera';
  });

  constructor() {
    // Recupera la sesión si se recarga la página.
    try {
      const guardado = sessionStorage.getItem(CLAVE_STORAGE);
      if (guardado) {
        this.usuarioActual.set(JSON.parse(guardado) as UsuarioAutenticado);
      }
    } catch {
      /* sin almacenamiento disponible */
    }

    // Guarda la sesión cada vez que cambia el usuario.
    effect(() => {
      const u = this.usuarioActual();
      try {
        if (u) {
          sessionStorage.setItem(CLAVE_STORAGE, JSON.stringify(u));
        } else {
          sessionStorage.removeItem(CLAVE_STORAGE);
        }
      } catch {
        /* sin almacenamiento disponible */
      }
    });
  }

  /** Ruta de inicio que le corresponde a cada rol. */
  rutaInicio(rol: RolUsuario): string {
    switch (rol) {
      case 'secretaria':
        return '/secretaria';
      case 'jefe_carrera':
        return '/jefatura';
      default:
        return '/egresado';
    }
  }

  login(credenciales: CredencialesLogin): Observable<UsuarioAutenticado> {
    if (!credenciales.rut || !credenciales.clave) {
      return throwError(() => new Error('Rut y clave son obligatorios.'));
    }

    const usuario: UsuarioAutenticado = {
      id: 'demo-1',
      nombres: 'Egresado',
      apellidos: 'Demo',
      rut: credenciales.rut,
      correo: 'demo@academicos.uta.cl',
      rol: 'egresado',
      telefono: '',
      empresa: '',
      cargo: '',
      rangoSueldo: '',
    };

    return of(usuario).pipe(delay(600));
  }

  registrar(datos: RegistroUsuario): Observable<UsuarioAutenticado> {
    if (datos.clave !== datos.claveConfirmacion) {
      return throwError(() => new Error('Las claves no coinciden.'));
    }

    // Todo usuario que se registra por su cuenta es un egresado (rol común).
    const usuario: UsuarioAutenticado = {
      id: 'demo-nuevo',
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      rut: datos.rut,
      correo: datos.correo,
      rol: 'egresado',
      telefono: datos.telefono ?? '',
      empresa: '',
      cargo: '',
      rangoSueldo: '',
    };

    return of(usuario).pipe(delay(600));
  }

  actualizarPerfil(datos: PerfilEditable): Observable<UsuarioAutenticado> {
    const actual = this.usuarioActual();
    if (!actual) {
      return throwError(() => new Error('No hay sesión activa.'));
    }

    const actualizado: UsuarioAutenticado = { ...actual, ...datos };
    return of(actualizado).pipe(delay(500));
  }

  /** Acceso de demostración del prototipo (sin validar credenciales). */
  loginDemo(
    rol: 'secretaria' | 'egresado' | 'jefe_carrera',
  ): UsuarioAutenticado {
    const demos: Record<
      'secretaria' | 'egresado' | 'jefe_carrera',
      UsuarioAutenticado
    > = {
      secretaria: {
        id: 'demo-sec',
        nombres: 'María',
        apellidos: 'Soto',
        rut: '12.345.678-5',
        correo: 'msoto@uta.cl',
        rol: 'secretaria',
        cargo: 'Secretaría DICI',
      },
      egresado: {
        id: 'demo-egr',
        nombres: 'Camila',
        apellidos: 'Rojas',
        rut: '19.876.543-2',
        correo: 'c.rojas@gmail.com',
        rol: 'egresado',
        cargo: 'Egresada · Cohorte 2021',
      },
      jefe_carrera: {
        id: 'demo-jef',
        nombres: 'Jorge',
        apellidos: 'Pérez',
        rut: '11.222.333-9',
        correo: 'jperez@uta.cl',
        rol: 'jefe_carrera',
        cargo: 'Jefatura de Carrera',
      },
    };
    return demos[rol];
  }

  cerrarSesion(): void {
    this.usuarioActual.set(null);
  }
}
