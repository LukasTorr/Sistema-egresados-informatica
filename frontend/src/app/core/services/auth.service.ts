import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, map, switchMap, throwError } from 'rxjs';

import { API_URL } from '../api';
import {
  ActivacionCuenta,
  CredencialesLogin,
  RolCuenta,
  RolUsuario,
  UsuarioAutenticado,
} from '../models/usuario.model';

const CLAVE_STORAGE = 'sse_usuario';

const CARGOS: Record<string, string> = {
  JEFE_CARRERA: 'Jefatura de Carrera',
  SECRETARIA: 'Secretaría DICI',
  COORDINADOR: 'Coordinación',
  DOCENTE: 'Docente',
  OTRO: 'Funcionario DICI',
};

interface RespuestaLogin {
  access_token: string;
  usuario: {
    id_cuenta: number;
    correo: string;
    rol: RolCuenta;
    id_egresado?: number;
    id_funcionario?: number;
  };
}

interface RespuestaPerfil {
  id_cuenta: number;
  correo: string;
  rol: RolCuenta;
  funcionario: {
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string | null;
    cargo: string;
  } | null;
  egresado: {
    id_egresado: number;
    rut: string;
    nombres: string;
    apellido_paterno: string;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly usuarioActual = signal<UsuarioAutenticado | null>(null);

  readonly esAdmin = computed(() => {
    const rol = this.usuarioActual()?.rol;
    return rol === 'secretaria' || rol === 'jefe_carrera';
  });

  constructor() {
    try {
      const guardado = sessionStorage.getItem(CLAVE_STORAGE);
      if (guardado) {
        this.usuarioActual.set(JSON.parse(guardado) as UsuarioAutenticado);
      }
    } catch {}

    effect(() => {
      const u = this.usuarioActual();
      try {
        if (u) {
          sessionStorage.setItem(CLAVE_STORAGE, JSON.stringify(u));
        } else {
          sessionStorage.removeItem(CLAVE_STORAGE);
        }
      } catch {}
    });
  }

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
    if (!credenciales.correo || !credenciales.clave) {
      return throwError(() => new Error('Correo y contraseña son obligatorios.'));
    }

    return this.http
      .post<RespuestaLogin>(`${API_URL}/auth/login`, {
        correo: credenciales.correo.trim(),
        contrasena: credenciales.clave,
      })
      .pipe(
        switchMap((res) =>
          this.http
            .get<RespuestaPerfil>(`${API_URL}/auth/perfil`, {
              headers: new HttpHeaders({ Authorization: `Bearer ${res.access_token}` }),
            })
            .pipe(map((perfil) => this.armarUsuario(res, perfil))),
        ),
      );
  }

  // Activa la cuenta de un egresado ya registrado por la Secretaría y luego inicia sesión con ella.
  activarCuenta(datos: ActivacionCuenta): Observable<UsuarioAutenticado> {
    const correo = datos.correo.trim().toLowerCase();
    return this.http
      .post(`${API_URL}/auth/activar-cuenta`, { rut: datos.rut, correo, contrasena: datos.clave })
      .pipe(switchMap(() => this.login({ correo, clave: datos.clave })));
  }

  cerrarSesion(): void {
    this.usuarioActual.set(null);
  }

  private armarUsuario(res: RespuestaLogin, perfil: RespuestaPerfil): UsuarioAutenticado {
    const { usuario } = res;
    const f = perfil.funcionario;
    const e = perfil.egresado;

    let rol: RolUsuario = 'egresado';
    if (usuario.rol === 'ADMINISTRADOR') rol = 'secretaria';
    else if (usuario.rol === 'FUNCIONARIO') {
      rol = f?.cargo === 'JEFE_CARRERA' ? 'jefe_carrera' : 'secretaria';
    }

    return {
      id: String(usuario.id_cuenta),
      nombres: f?.nombres ?? e?.nombres ?? usuario.correo,
      apellidos: f ? [f.apellido_paterno, f.apellido_materno].filter(Boolean).join(' ') : e?.apellido_paterno ?? '',
      rut: e?.rut ?? '',
      correo: usuario.correo,
      rol,
      rolCuenta: usuario.rol,
      token: res.access_token,
      idEgresado: usuario.id_egresado,
      idFuncionario: usuario.id_funcionario,
      cargo: f ? CARGOS[f.cargo] ?? f.cargo : undefined,
    };
  }
}
