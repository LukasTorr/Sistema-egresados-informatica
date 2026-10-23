import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h1 class="inicio__titulo">
      Hola, {{ auth.usuarioActual()?.nombres || 'egresado/a' }} 👋
    </h1>
    <p class="inicio__subtitulo">
      Bienvenido al Sistema de Egresados de Ingeniería Civil en Computación e
      Informática.
    </p>
  `,
  styles: [
    `
      .inicio__titulo {
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--uta-navy);
        margin-bottom: 8px;
      }
      .inicio__subtitulo {
        color: var(--ink-soft);
        font-size: 0.95rem;
      }
    `,
  ],
})
export class InicioComponent {
  readonly auth = inject(AuthService);
}
