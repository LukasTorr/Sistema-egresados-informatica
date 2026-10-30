import { Component, inject, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { mensajeError } from '../../core/api';
import { AuthService } from '../../core/services/auth.service';

function clavesCoinciden(group: AbstractControl) {
  const { nueva, confirmacion } = group.value;
  return nueva && confirmacion && nueva !== confirmacion ? { noCoinciden: true } : null;
}

// Ventana que no se puede cerrar: aparece mientras la cuenta tenga la contraseña inicial que le dio la Secretaría.
@Component({
  selector: 'app-cambio-contrasena',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './cambio-contrasena.component.html',
  styleUrl: './cambio-contrasena.component.css',
})
export class CambioContrasenaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly salir = output<void>();

  readonly guardando = signal(false);
  readonly intentoFallido = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group(
    {
      actual: ['', Validators.required],
      nueva: ['', [Validators.required, Validators.minLength(8)]],
      confirmacion: ['', Validators.required],
    },
    { validators: clavesCoinciden },
  );

  invalido(campo: 'actual' | 'nueva' | 'confirmacion'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || this.intentoFallido());
  }

  guardar(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.intentoFallido.set(true);
      return;
    }

    const { actual, nueva } = this.form.getRawValue();
    this.guardando.set(true);
    this.auth.cambiarContrasena(actual, nueva).subscribe({
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err, 'No fue posible cambiar la contraseña.'));
      },
    });
  }
}
