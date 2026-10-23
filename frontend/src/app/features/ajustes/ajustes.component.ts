import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { TemaService } from '../../core/services/tema.service';

const NOMBRE_ROL: Record<string, string> = {
  secretaria: 'Secretaría',
  jefe_carrera: 'Jefatura de carrera',
  egresado: 'Egresado/a',
};

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './ajustes.component.html',
  styleUrl: './ajustes.component.css',
})
export class AjustesComponent {
  private readonly auth = inject(AuthService);
  readonly tema = inject(TemaService);

  readonly usuario = this.auth.usuarioActual;
  readonly nombreRol = computed(() => NOMBRE_ROL[this.usuario()?.rol ?? ''] ?? '');
  readonly esEgresado = computed(() => this.usuario()?.rol === 'egresado');
}
