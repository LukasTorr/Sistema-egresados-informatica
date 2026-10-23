import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

interface ItemMenu {
  etiqueta: string;
  ruta: string;
  exacto: boolean;
}

interface ConfigRol {
  titulo: string;
  etiquetaMenu: string;
  cargoPorDefecto: string;
  notificaciones: number;
  admin: boolean;
  items: ItemMenu[];
}

const CONFIG: Record<string, ConfigRol> = {
  secretaria: {
    titulo: 'Secretaría',
    etiquetaMenu: 'SECRETARÍA',
    cargoPorDefecto: 'Secretaría DICI',
    notificaciones: 3,
    admin: true,
    items: [
      { etiqueta: 'Inicio', ruta: '/secretaria', exacto: true },
      { etiqueta: 'Directorio', ruta: '/secretaria/directorio', exacto: false },
      { etiqueta: 'Registrar egresado', ruta: '/secretaria/registrar', exacto: false },
      { etiqueta: 'Carga masiva', ruta: '/secretaria/carga-masiva', exacto: false },
      { etiqueta: 'Comunicaciones', ruta: '/secretaria/comunicaciones', exacto: false },
      { etiqueta: 'Ofertas laborales', ruta: '/secretaria/ofertas', exacto: false },
      { etiqueta: 'Actividades', ruta: '/secretaria/actividades', exacto: false },
      { etiqueta: 'Encuestas e informes', ruta: '/secretaria/encuestas', exacto: false },
    ],
  },
  jefe_carrera: {
    titulo: 'Jefatura',
    etiquetaMenu: 'JEFATURA DE CARRERA',
    cargoPorDefecto: 'Jefatura de Carrera',
    notificaciones: 1,
    admin: true,
    items: [
      { etiqueta: 'Panel de métricas', ruta: '/jefatura', exacto: true },
      { etiqueta: 'Directorio', ruta: '/jefatura/directorio', exacto: false },
      { etiqueta: 'Informes de cierre', ruta: '/jefatura/informes', exacto: false },
    ],
  },
  egresado: {
    titulo: 'Egresado',
    etiquetaMenu: 'EGRESADO',
    cargoPorDefecto: 'Egresado/a ICCI',
    notificaciones: 2,
    admin: false,
    items: [
      { etiqueta: 'Inicio', ruta: '/egresado', exacto: true },
      { etiqueta: 'Mi perfil', ruta: '/egresado/perfil', exacto: false },
      { etiqueta: 'Ofertas laborales', ruta: '/egresado/ofertas', exacto: false },
      { etiqueta: 'Actividades', ruta: '/egresado/actividades', exacto: false },
      { etiqueta: 'Encuestas', ruta: '/egresado/encuestas', exacto: false },
    ],
  },
};

@Component({
  selector: 'app-panel-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './panel-layout.component.html',
  styleUrl: './panel-layout.component.css',
})
export class PanelLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = this.auth.usuarioActual;

  readonly config = computed<ConfigRol>(() => {
    const rol = this.usuario()?.rol ?? 'egresado';
    return CONFIG[rol] ?? CONFIG['egresado'];
  });

  readonly seccionActual = signal('Inicio');
  readonly confirmandoCierreSesion = signal(false);

  readonly nombreCompleto = computed(() => {
    const u = this.usuario();
    return u ? `${u.nombres} ${u.apellidos}` : 'Usuario';
  });

  readonly iniciales = computed(() => {
    const u = this.usuario();
    if (!u) return 'U';
    return `${u.nombres[0] ?? ''}${u.apellidos[0] ?? ''}`.toUpperCase();
  });

  readonly cargo = computed(() => this.usuario()?.cargo ?? this.config().cargoPorDefecto);

  constructor() {
    this.actualizarSeccion();
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.actualizarSeccion());
  }

  private actualizarSeccion(): void {
    const items = this.config().items;
    const url = this.router.url;
    const item = [...items].reverse().find((m) => url.startsWith(m.ruta));
    this.seccionActual.set(item?.etiqueta ?? items[0].etiqueta);
  }

  pedirConfirmacionCierreSesion(): void {
    this.confirmandoCierreSesion.set(true);
  }

  cancelarCierreSesion(): void {
    this.confirmandoCierreSesion.set(false);
  }

  confirmarCierreSesion(): void {
    this.confirmandoCierreSesion.set(false);
    this.auth.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}