import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { API_URL, mensajeError } from '../../../core/api';
import { AuthService } from '../../../core/services/auth.service';

interface Cuenta {
  id_cuenta: number;
  correo: string;
  rol: 'ADMINISTRADOR' | 'FUNCIONARIO' | 'EGRESADO';
  activo: boolean;
  debe_cambiar_contrasena: boolean;
  funcionario: { nombres: string; apellido_paterno: string; apellido_materno: string | null; cargo: string } | null;
}

const CARGOS: Record<string, string> = {
  SECRETARIA: 'Secretaría',
  JEFE_CARRERA: 'Jefatura de carrera',
  COORDINADOR: 'Coordinación',
  DOCENTE: 'Docente',
  OTRO: 'Otro',
};

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['../registrar/registrar-egresado.component.css', './usuarios.component.css'],
})
export class UsuariosComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly cargos = Object.entries(CARGOS).map(([valor, etiqueta]) => ({ valor, etiqueta }));
  readonly cuentas = signal<Cuenta[]>([]);
  readonly enviando = signal(false);
  readonly intentoFallido = signal(false);
  readonly mensajeOk = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombres: ['', Validators.required],
    apellido_paterno: ['', Validators.required],
    apellido_materno: [''],
    correo: ['', [Validators.required, Validators.email]],
    cargo: ['SECRETARIA', Validators.required],
    esAdministrador: [false],
    contrasena: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor() {
    this.cargar();
  }

  invalido(campo: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || this.intentoFallido());
  }

  nombre(c: Cuenta): string {
    const f = c.funcionario;
    return f ? [f.nombres, f.apellido_paterno, f.apellido_materno].filter(Boolean).join(' ') : '—';
  }

  cargo(c: Cuenta): string {
    return c.funcionario ? CARGOS[c.funcionario.cargo] ?? c.funcionario.cargo : '—';
  }

  esPropia(c: Cuenta): boolean {
    return String(c.id_cuenta) === this.auth.usuarioActual()?.id;
  }

  crear(): void {
    this.mensajeOk.set(null);
    this.error.set(null);
    if (this.form.invalid) {
      this.intentoFallido.set(true);
      return;
    }

    const { esAdministrador, apellido_materno, ...datos } = this.form.getRawValue();
    this.enviando.set(true);
    this.http
      .post<Cuenta>(`${API_URL}/usuarios/funcionarios`, {
        ...datos,
        apellido_materno: apellido_materno || undefined,
        rol: esAdministrador ? 'ADMINISTRADOR' : 'FUNCIONARIO',
        rol_funcionario: esAdministrador ? 'ADMINISTRADOR' : 'GESTOR',
      })
      .subscribe({
        next: (c) => {
          this.enviando.set(false);
          this.intentoFallido.set(false);
          this.form.reset();
          this.mensajeOk.set(
            `Cuenta creada para ${c.correo}. Deberá cambiar la contraseña inicial la primera vez que entre.`,
          );
          this.cargar();
        },
        error: (err) => {
          this.enviando.set(false);
          this.error.set(mensajeError(err, 'No fue posible crear la cuenta.'));
        },
      });
  }

  cambiarEstado(c: Cuenta): void {
    this.mensajeOk.set(null);
    this.error.set(null);
    this.http.patch<Cuenta>(`${API_URL}/usuarios/${c.id_cuenta}/estado`, { activo: !c.activo }).subscribe({
      next: (actualizada) => this.cuentas.update((lista) => lista.map((x) => (x.id_cuenta === c.id_cuenta ? actualizada : x))),
      error: (err) => this.error.set(mensajeError(err, 'No fue posible cambiar el estado de la cuenta.')),
    });
  }

  // Solo se listan cuentas del personal; los egresados se gestionan desde el directorio.
  private cargar(): void {
    this.http
      .get<Cuenta[]>(`${API_URL}/usuarios`)
      .subscribe((lista) => this.cuentas.set(lista.filter((c) => c.rol !== 'EGRESADO')));
  }
}
