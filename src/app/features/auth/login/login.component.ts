import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

type RolLogin = 'secretaria' | 'egresado' | 'jefe_carrera';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly roles: { valor: RolLogin; etiqueta: string }[] = [
    { valor: 'secretaria', etiqueta: 'Secretaría' },
    { valor: 'egresado', etiqueta: 'Egresado' },
    { valor: 'jefe_carrera', etiqueta: 'Jefatura' },
  ];

  readonly rolSeleccionado = signal<RolLogin | null>(null);
  readonly error = signal<string | null>(null);

  seleccionarRol(rol: RolLogin): void {
    this.rolSeleccionado.set(rol);
    this.error.set(null);
  }

  ingresar(): void {
    const rol = this.rolSeleccionado();

    if (!rol) {
      this.error.set('Selecciona un rol para ingresar.');
      return;
    }

    // Prototipo: el rol elegido define la cuenta. Más adelante aquí se validan las credenciales reales.
    const usuario = this.auth.loginDemo(rol);
    this.auth.usuarioActual.set(usuario);
    this.router.navigateByUrl(this.auth.rutaInicio(usuario.rol));
  }
}
