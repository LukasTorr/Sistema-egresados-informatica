import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import {
  rutValidator,
  formatearRut,
} from '../../../core/validators/rut.validator';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly claveVisible = signal(false);
  readonly enviando = signal(false);
  readonly errorServidor = signal<string | null>(null);

  readonly form = this.fb.group({
    rut: ['', [Validators.required, rutValidator()]],
    clave: ['', [Validators.required, Validators.minLength(4)]],
  });

  onRutInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formateado = formatearRut(input.value);
    this.form.controls.rut.setValue(formateado, { emitEvent: false });
  }

  alternarVisibilidadClave(): void {
    this.claveVisible.update((v) => !v);
  }

  get rutInvalido(): boolean {
    const c = this.form.controls.rut;
    return c.touched && c.invalid;
  }

  get claveInvalida(): boolean {
    const c = this.form.controls.clave;
    return c.touched && c.invalid;
  }

  iniciarSesion(): void {
    this.errorServidor.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    const { rut, clave } = this.form.getRawValue();

    this.auth.login({ rut: rut!, clave: clave! }).subscribe({
      next: (usuario) => {
        this.enviando.set(false);
        this.auth.usuarioActual.set(usuario);
        this.router.navigateByUrl('/dashboard');
      },
      error: (err: Error) => {
        this.enviando.set(false);
        this.errorServidor.set(err.message || 'No fue posible iniciar sesión.');
      },
    });
  }
}
