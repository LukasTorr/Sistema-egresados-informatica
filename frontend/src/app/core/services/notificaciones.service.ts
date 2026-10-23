import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { API_URL } from '../api';
import { AuthService } from './auth.service';

export interface Notificacion {
  id: number;
  titulo: string;
  texto: string;
  fecha: string;
  autor: string;
}

interface ComunicacionApi {
  id_comunicacion: number;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
  funcionario?: { nombres: string; apellido_paterno: string } | null;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly lista = signal<Notificacion[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  private readonly vistas = signal<Set<number>>(new Set());

  readonly noLeidas = computed(() => this.lista().filter((n) => !this.vistas().has(n.id)).length);

  esNueva(n: Notificacion): boolean {
    return !this.vistas().has(n.id);
  }

  // El egresado ve las comunicaciones dirigidas a él; secretaría y jefatura, las últimas publicadas.
  cargar(): void {
    const usuario = this.auth.usuarioActual();
    if (!usuario) return;

    this.vistas.set(this.leerVistas());
    const ruta = usuario.rol === 'egresado' ? 'comunicaciones/mis-comunicaciones' : 'comunicaciones';

    this.cargando.set(true);
    this.error.set(null);
    this.http
      .get<{ datos: ComunicacionApi[] }>(`${API_URL}/${ruta}`, { params: { por_pagina: 8 } })
      .subscribe({
        next: (res) => {
          this.cargando.set(false);
          this.lista.set(
            res.datos.map((c) => ({
              id: c.id_comunicacion,
              titulo: c.titulo,
              texto: c.contenido,
              fecha: new Date(c.fecha_publicacion).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }),
              autor: c.funcionario
                ? `${c.funcionario.nombres} ${c.funcionario.apellido_paterno}`
                : 'Secretaría DICI',
            })),
          );
        },
        error: () => {
          this.cargando.set(false);
          this.error.set('No se pudieron cargar las notificaciones.');
        },
      });
  }

  marcarTodasLeidas(): void {
    const vistas = new Set(this.vistas());
    this.lista().forEach((n) => vistas.add(n.id));
    this.vistas.set(vistas);
    try {
      localStorage.setItem(this.claveVistas(), JSON.stringify([...vistas]));
    } catch {}
  }

  private claveVistas(): string {
    return `sse_notif_vistas_${this.auth.usuarioActual()?.id ?? ''}`;
  }

  private leerVistas(): Set<number> {
    try {
      return new Set(JSON.parse(localStorage.getItem(this.claveVistas()) ?? '[]') as number[]);
    } catch {
      return new Set();
    }
  }
}
