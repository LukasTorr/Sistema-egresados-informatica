import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import {
  rutValidator,
  formatearRut,
} from '../../../core/validators/rut.validator';

function clavesCoincidenValidator(group: any) {
  const clave = group.get('clave')?.value;
  const confirmacion = group.get('claveConfirmacion')?.value;
  return clave && confirmacion && clave !== confirmacion
    ? { clavesNoCoinciden: true }
    : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly enviando = signal(false);
  readonly errorServidor = signal<string | null>(null);

  readonly form = this.fb.group(
    {
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      rut: ['', [Validators.required, rutValidator()]],
      correo: ['', [Validators.required, Validators.email]],
      telefono: [''],
      clave: ['', [Validators.required, Validators.minLength(6)]],
      claveConfirmacion: ['', Validators.required],
    },
    { validators: clavesCoincidenValidator },
  );

  onRutInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.controls.rut.setValue(formatearRut(input.value), {
      emitEvent: false,
    });
  }

  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  crearCuenta(): void {
    this.errorServidor.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    const datos = this.form.getRawValue();

    this.auth
      .registrar({
        nombres: datos.nombres!,
        apellidos: datos.apellidos!,
        rut: datos.rut!,
        correo: datos.correo!,
        telefono: datos.telefono ?? undefined,
        clave: datos.clave!,
        claveConfirmacion: datos.claveConfirmacion!,
      })
      .subscribe({
        next: (usuario) => {
          this.enviando.set(false);
          this.auth.usuarioActual.set(usuario);
          this.router.navigateByUrl('/dashboard');
        },
        error: (err: Error) => {
          this.enviando.set(false);
          this.errorServidor.set(
            err.message || 'No fue posible crear la cuenta.',
          );
        },
      });
  }
}
