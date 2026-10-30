import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { mensajeError } from '../../core/api';
import { AuthService } from '../../core/services/auth.service';
import { TemaService } from '../../core/services/tema.service';

function clavesCoinciden(group: AbstractControl) {
  const { nueva, confirmacion } = group.value;
  return nueva && confirmacion && nueva !== confirmacion ? { noCoinciden: true } : null;
}

const NOMBRE_ROL: Record<string, string> = {
  secretaria: 'Secretaría',
  jefe_carrera: 'Jefatura de carrera',
  egresado: 'Egresado/a',
};

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './ajustes.component.html',
  styleUrl: './ajustes.component.css',
})
export class AjustesComponent {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  readonly tema = inject(TemaService);

  readonly usuario = this.auth.usuarioActual;
  readonly nombreRol = computed(() => NOMBRE_ROL[this.usuario()?.rol ?? ''] ?? '');
  readonly esEgresado = computed(() => this.usuario()?.rol === 'egresado');

  readonly guardandoClave = signal(false);
  readonly intentoClave = signal(false);
  readonly claveOk = signal<string | null>(null);
  readonly claveError = signal<string | null>(null);

  readonly formClave = this.fb.nonNullable.group(
    {
      actual: ['', Validators.required],
      nueva: ['', [Validators.required, Validators.minLength(8)]],
      confirmacion: ['', Validators.required],
    },
    { validators: clavesCoinciden },
  );

  claveInvalida(campo: 'actual' | 'nueva' | 'confirmacion'): boolean {
    const c = this.formClave.controls[campo];
    return c.invalid && (c.touched || this.intentoClave());
  }

  cambiarClave(): void {
    this.claveOk.set(null);
    this.claveError.set(null);
    if (this.formClave.invalid) {
      this.intentoClave.set(true);
      return;
    }

    const { actual, nueva } = this.formClave.getRawValue();
    this.guardandoClave.set(true);
    this.auth.cambiarContrasena(actual, nueva).subscribe({
      next: () => {
        this.guardandoClave.set(false);
        this.intentoClave.set(false);
        this.formClave.reset();
        this.claveOk.set('Contraseña actualizada. Úsala la próxima vez que inicies sesión.');
      },
      error: (err) => {
        this.guardandoClave.set(false);
        this.claveError.set(mensajeError(err, 'No fue posible cambiar la contraseña.'));
      },
    });
  }
}
