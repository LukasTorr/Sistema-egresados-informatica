import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css',
})
export class DashboardLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly sidebarColapsado = signal(false);
  readonly grupoAbierto = signal<string | null>('egresados');
  readonly menuUsuarioAbierto = signal(false);

  readonly usuario = this.auth.usuarioActual;

  readonly nombreUsuario = computed(() => {
    const u = this.usuario();
    return u ? `${u.nombres} ${u.apellidos}` : 'Usuario';
  });

  readonly inicialesUsuario = computed(() => {
    const u = this.usuario();
    if (!u) return 'U';
    return `${u.nombres[0] ?? ''}${u.apellidos[0] ?? ''}`.toUpperCase();
  });

  toggleSidebar(): void {
    this.sidebarColapsado.update((v) => !v);
  }

  toggleGrupo(nombre: string): void {
    this.grupoAbierto.update((actual) => (actual === nombre ? null : nombre));
  }

  toggleMenuUsuario(): void {
    this.menuUsuarioAbierto.update((v) => !v);
  }

  readonly confirmandoCierreSesion = signal(false);

  pedirConfirmacionCierreSesion(): void {
    this.menuUsuarioAbierto.set(false);
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
