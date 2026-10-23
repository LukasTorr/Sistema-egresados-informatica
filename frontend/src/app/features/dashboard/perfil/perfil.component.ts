import { Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css',
})
export class PerfilComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  readonly usuario = this.auth.usuarioActual;
  readonly guardando = signal(false);
  readonly guardadoOk = signal(false);

  readonly form = this.fb.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    telefono: [''],
    empresa: [''],
    cargo: [''],
    rangoSueldo: [''],
  });

  constructor() {
    effect(() => {
      const u = this.usuario();
      if (u) {
        this.form.patchValue(
          {
            nombres: u.nombres,
            apellidos: u.apellidos,
            telefono: u.telefono ?? '',
            empresa: u.empresa ?? '',
            cargo: u.cargo ?? '',
            rangoSueldo: u.rangoSueldo ?? '',
          },
          { emitEvent: false },
        );
      }
    });
  }

  guardar(): void {
    this.guardadoOk.set(false);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    const datos = this.form.getRawValue();

    this.auth
      .actualizarPerfil({
        nombres: datos.nombres!,
        apellidos: datos.apellidos!,
        telefono: datos.telefono ?? undefined,
        empresa: datos.empresa ?? undefined,
        cargo: datos.cargo ?? undefined,
        rangoSueldo: datos.rangoSueldo ?? undefined,
      })
      .subscribe((actualizado) => {
        this.auth.usuarioActual.set(actualizado);
        this.guardando.set(false);
        this.guardadoOk.set(true);
      });
  }
}
