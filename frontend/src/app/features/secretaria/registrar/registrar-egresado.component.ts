import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import {
  formatearRut,
  rutValidator,
} from '../../../core/validators/rut.validator';

type Situacion =
  | 'empleado'
  | 'independiente'
  | 'buscando'
  | 'estudiando'
  | 'otro';
type Campo =
  | 'nombres'
  | 'apellidos'
  | 'rut'
  | 'correo'
  | 'telefono'
  | 'anioIngreso'
  | 'anioEgreso';

interface ItemChecklist {
  estado: 'ok' | 'error' | 'pending';
  texto: string;
}

const ANIO_ACTUAL = new Date().getFullYear();

@Component({
  selector: 'app-registrar-egresado',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './registrar-egresado.component.html',
  styleUrl: './registrar-egresado.component.css',
})
export class RegistrarEgresadoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  /** Simulación del directorio actual. Con backend, esto se consulta al servidor. */
  private readonly correosExistentes: string[] = [
    'c.rojas@gmail.com',
    'diego.fuentes@gmail.com',
  ];

  readonly generos = ['Femenino', 'Masculino', 'Otro', 'Prefiero no decir'];

  readonly regiones = [
    'Arica y Parinacota',
    'Tarapacá',
    'Antofagasta',
    'Atacama',
    'Coquimbo',
    'Valparaíso',
    'Metropolitana de Santiago',
    "Libertador General Bernardo O'Higgins",
    'Maule',
    'Ñuble',
    'Biobío',
    'La Araucanía',
    'Los Ríos',
    'Los Lagos',
    'Aysén',
    'Magallanes',
  ];

  readonly anios = Array.from(
    { length: ANIO_ACTUAL - 1989 },
    (_, i) => ANIO_ACTUAL - i,
  );

  readonly areas = [
    'Desarrollo de software',
    'Infraestructura y redes',
    'Ciencia de datos',
    'Ciberseguridad',
    'Gestión de proyectos TI',
    'Otra',
  ];

  readonly situaciones: { valor: Situacion; etiqueta: string }[] = [
    { valor: 'empleado', etiqueta: 'Empleado/a' },
    { valor: 'independiente', etiqueta: 'Independiente' },
    { valor: 'buscando', etiqueta: 'Buscando empleo' },
    { valor: 'estudiando', etiqueta: 'Estudiando' },
    { valor: 'otro', etiqueta: 'Otro' },
  ];

  readonly guardando = signal(false);
  readonly mensajeOk = signal<string | null>(null);
  readonly intentoFallido = signal(false);

  readonly form = this.fb.nonNullable.group({
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    rut: ['', [Validators.required, rutValidator()]],
    fechaNacimiento: [''],
    genero: [''],
    correo: [
      '',
      [Validators.required, Validators.email, this.correoDuplicadoValidator()],
    ],
    telefono: ['', Validators.required],
    region: [''],
    linkedin: [''],
    anioIngreso: ['', Validators.required],
    anioEgreso: ['', Validators.required],
    anioTitulacion: [''],
    area: [''],
    situacion: ['empleado' as Situacion, Validators.required],
    empresa: [''],
    cargo: [''],
  });

  /** Se actualiza en cada cambio del formulario, para refrescar el recuadro "Antes de guardar". */
  private readonly valores = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly checklist = computed<ItemChecklist[]>(() => {
    this.valores();
    const c = this.form.controls;

    const datosCompletos =
      c.nombres.valid &&
      c.apellidos.valid &&
      c.correo.valid &&
      c.telefono.valid &&
      c.situacion.valid;

    const rutVacio = !c.rut.value.trim();
    const rutItem: ItemChecklist = c.rut.valid
      ? { estado: 'ok', texto: 'RUT con formato y dígito verificador válido' }
      : rutVacio
        ? { estado: 'pending', texto: 'RUT pendiente' }
        : {
            estado: 'error',
            texto: 'RUT con formato o dígito verificador inválido',
          };

    const correoVacio = !c.correo.value.trim();
    const duplicado = !!c.correo.errors?.['duplicado'];
    const correoItem: ItemChecklist = duplicado
      ? { estado: 'error', texto: 'Correo duplicado en el directorio' }
      : correoVacio
        ? { estado: 'pending', texto: 'Correo pendiente' }
        : { estado: 'ok', texto: 'Correo sin duplicados en el directorio' };

    const telefonoItem: ItemChecklist = c.telefono.value.trim()
      ? { estado: 'ok', texto: 'Teléfono ingresado' }
      : { estado: 'pending', texto: 'Teléfono pendiente' };

    return [
      {
        estado: datosCompletos ? 'ok' : 'pending',
        texto: 'Nombre, contacto y situación laboral completos',
      },
      rutItem,
      correoItem,
      telefonoItem,
    ];
  });

  private correoDuplicadoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = String(control.value ?? '')
        .trim()
        .toLowerCase();
      return valor && this.correosExistentes.includes(valor)
        ? { duplicado: true }
        : null;
    };
  }

  invalido(campo: Campo): boolean {
    const c = this.form.controls[campo];
    return c.touched && c.invalid;
  }

  get correoDuplicado(): boolean {
    const c = this.form.controls.correo;
    return !!c.errors?.['duplicado'] && (c.touched || c.dirty);
  }

  get rutValido(): boolean {
    const c = this.form.controls.rut;
    return c.valid && !!c.value;
  }

  get muestraEmpresa(): boolean {
    const s = this.form.controls.situacion.value;
    return s === 'empleado' || s === 'independiente';
  }

  onRutInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.controls.rut.setValue(formatearRut(input.value));
  }

  seleccionarSituacion(valor: Situacion): void {
    this.form.controls.situacion.setValue(valor);
  }

  cancelar(): void {
    this.router.navigateByUrl('/secretaria');
  }

  guardar(): void {
    this.mensajeOk.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.intentoFallido.set(true);
      return;
    }

    this.intentoFallido.set(false);
    this.guardando.set(true);

    const correo = this.form.controls.correo.value.trim().toLowerCase();

    // Simulación de guardado. Con backend, aquí va la llamada HTTP.
    setTimeout(() => {
      this.correosExistentes.push(correo);
      this.guardando.set(false);
      this.mensajeOk.set(
        `Egresado registrado. Se envió un correo de activación a ${correo}.`,
      );
      this.form.reset();
    }, 600);
  }
}
