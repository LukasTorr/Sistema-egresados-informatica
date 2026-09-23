import { Injectable, signal } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import {
  CredencialesLogin,
  RegistroUsuario,
  UsuarioAutenticado,
} from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly usuarioActual = signal<UsuarioAutenticado | null>(null);

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
    };

    return of(usuario).pipe(delay(600));
  }

  registrar(datos: RegistroUsuario): Observable<UsuarioAutenticado> {
    if (datos.clave !== datos.claveConfirmacion) {
      return throwError(() => new Error('Las claves no coinciden.'));
    }

    const usuario: UsuarioAutenticado = {
      id: 'demo-nuevo',
      nombres: datos.nombres,
      apellidos: datos.apellidos,
      rut: datos.rut,
      correo: datos.correo,
      rol: 'egresado',
    };

    return of(usuario).pipe(delay(600));
  }

  cerrarSesion(): void {
    this.usuarioActual.set(null);
  }
}
