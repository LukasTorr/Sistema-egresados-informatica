import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { mensajeError } from '../../../core/api';
import { AuthService } from '../../../core/services/auth.service';

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

  readonly error = signal<string | null>(null);
  readonly ingresando = signal(false);

  ingresar(correo: string, clave: string): void {
    this.error.set(null);
    this.ingresando.set(true);

    this.auth.login({ correo, clave }).subscribe({
      next: (usuario) => {
        this.ingresando.set(false);
        this.auth.usuarioActual.set(usuario);
        this.router.navigateByUrl(this.auth.rutaInicio(usuario.rol));
      },
      error: (err) => {
        this.ingresando.set(false);
        this.error.set(err instanceof Error ? err.message : mensajeError(err, 'No fue posible iniciar sesión.'));
      },
    });
  }
}
