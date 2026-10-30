import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { TemaService } from '../../core/services/tema.service';
import { CambioContrasenaComponent } from './cambio-contrasena.component';

interface ItemMenu {
  etiqueta: string;
  ruta: string;
  exacto: boolean;
}

interface ConfigRol {
  titulo: string;
  cargoPorDefecto: string;
  admin: boolean;
  items: ItemMenu[];
}

const ITEMS_GESTION = (base: string): ItemMenu[] => [
  { etiqueta: 'Inicio', ruta: base, exacto: true },
  { etiqueta: 'Directorio', ruta: `${base}/directorio`, exacto: false },
  { etiqueta: 'Registrar egresado', ruta: `${base}/registrar`, exacto: false },
  { etiqueta: 'Carga masiva', ruta: `${base}/carga-masiva`, exacto: false },
  { etiqueta: 'Comunicaciones', ruta: `${base}/comunicaciones`, exacto: false },
  { etiqueta: 'Ofertas laborales', ruta: `${base}/ofertas`, exacto: false },
  { etiqueta: 'Actividades', ruta: `${base}/actividades`, exacto: false },
  { etiqueta: 'Encuestas e informes', ruta: `${base}/encuestas`, exacto: false },
];

const CONFIG: Record<string, ConfigRol> = {
  administrador: {
    titulo: 'Administración',
    cargoPorDefecto: 'Administrador',
    admin: true,
    items: [...ITEMS_GESTION('/admin'), { etiqueta: 'Funcionarios', ruta: '/admin/funcionarios', exacto: false }],
  },
  secretaria: {
    titulo: 'Secretaría',
    cargoPorDefecto: 'Secretaría DICI',
    admin: true,
    items: ITEMS_GESTION('/secretaria'),
  },
  jefe_carrera: {
    titulo: 'Jefatura',
    cargoPorDefecto: 'Jefatura de Carrera',
    admin: true,
    items: [
      { etiqueta: 'Panel de métricas', ruta: '/jefatura', exacto: true },
      { etiqueta: 'Directorio', ruta: '/jefatura/directorio', exacto: false },
      { etiqueta: 'Informes de cierre', ruta: '/jefatura/informes', exacto: false },
    ],
  },
  egresado: {
    titulo: 'Egresado',
    cargoPorDefecto: 'Egresado/a ICCI',
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
  imports: [CambioContrasenaComponent, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './panel-layout.component.html',
  styleUrl: './panel-layout.component.css',
})
export class PanelLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly notificaciones = inject(NotificacionesService);
  readonly tema = inject(TemaService);

  readonly usuario = this.auth.usuarioActual;

  readonly config = computed<ConfigRol>(() => {
    const rol = this.usuario()?.rol ?? 'egresado';
    return CONFIG[rol] ?? CONFIG['egresado'];
  });

  readonly items = computed(() => this.config().items);

  readonly seccionActual = signal('Inicio');
  readonly confirmandoCierreSesion = signal(false);
  readonly menuAbierto = signal<'notificaciones' | 'usuario' | null>(null);

  readonly rutaBase = computed(() => this.auth.rutaInicio(this.usuario()?.rol ?? 'egresado'));

  // Secretaría y jefatura no tienen ficha de egresado, así que su perfil es la página de ajustes.
  readonly rutaPerfil = computed(() =>
    this.usuario()?.rol === 'egresado' ? '/egresado/perfil' : `${this.rutaBase()}/ajustes`,
  );

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

  // Rol de la cuenta para el título del menú; un funcionario se muestra con su cargo.
  readonly rolVisible = computed(() => {
    const u = this.usuario();
    if (u?.rolCuenta === 'ADMINISTRADOR') return 'Administrador';
    if (u?.rolCuenta === 'EGRESADO') return 'Egresado';
    return this.cargo();
  });

  constructor() {
    this.notificaciones.cargar();
    this.actualizarSeccion();
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.menuAbierto.set(null);
        this.actualizarSeccion();
      });
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  cerrarMenus(): void {
    this.menuAbierto.set(null);
  }

  alternarMenu(menu: 'notificaciones' | 'usuario', evento: Event): void {
    evento.stopPropagation();
    const abrir = this.menuAbierto() !== menu;
    this.menuAbierto.set(abrir ? menu : null);
    if (abrir && menu === 'notificaciones') this.notificaciones.cargar();
  }

  private actualizarSeccion(): void {
    const items = this.items();
    const url = this.router.url;
    const item = [...items].reverse().find((m) => url.startsWith(m.ruta));
    const fuera = url.endsWith('/ajustes') ? 'Ajustes' : null;
    this.seccionActual.set(fuera ?? item?.etiqueta ?? items[0].etiqueta);
  }

  pedirConfirmacionCierreSesion(): void {
    this.menuAbierto.set(null);
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