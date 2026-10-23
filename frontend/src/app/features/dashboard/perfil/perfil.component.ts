import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Observable, forkJoin, of } from 'rxjs';

import { API_URL, mensajeError } from '../../../core/api';

interface Telefono {
  id_telefono: number;
  telefono: string;
  es_principal: boolean;
}

interface Situacion {
  estado_laboral: string;
  empresa: string | null;
  cargo: string | null;
  rango_sueldo: string | null;
  es_actual: boolean;
}

interface Egresado {
  id_egresado: number;
  rut: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  ciudad_residencia: string | null;
  anio_ingreso: number | null;
  anio_egreso: number | null;
  especialidad: { nombre: string } | null;
  correos: { correo: string; es_principal: boolean }[];
  telefonos: Telefono[];
  situaciones: Situacion[];
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './perfil.component.html',
  styleUrl: '../../secretaria/registrar/registrar-egresado.component.css',
})
export class PerfilComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  readonly egresado = signal<Egresado | null>(null);
  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly mensajeOk = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly estados = [
    { valor: 'EMPLEADO', etiqueta: 'Empleado/a' },
    { valor: 'INDEPENDIENTE', etiqueta: 'Independiente' },
    { valor: 'DESEMPLEADO', etiqueta: 'Buscando empleo' },
    { valor: 'ESTUDIANDO', etiqueta: 'Estudiando' },
    { valor: 'OTRO', etiqueta: 'Otro' },
  ];

  readonly rangos = [
    { valor: 'MENOS_500K', etiqueta: 'Menos de $500.000' },
    { valor: 'ENTRE_500K_1M', etiqueta: '$500.000 a $1.000.000' },
    { valor: 'ENTRE_1M_1_5M', etiqueta: '$1.000.000 a $1.500.000' },
    { valor: 'ENTRE_1_5M_2M', etiqueta: '$1.500.000 a $2.000.000' },
    { valor: 'ENTRE_2M_3M', etiqueta: '$2.000.000 a $3.000.000' },
    { valor: 'MAS_3M', etiqueta: 'Más de $3.000.000' },
    { valor: 'NO_INFORMA', etiqueta: 'Prefiero no informar' },
  ];

  readonly form = this.fb.nonNullable.group({
    apellido_materno: [''],
    ciudad_residencia: [''],
    telefono: [''],
    estado_laboral: ['EMPLEADO'],
    empresa: [''],
    cargo: [''],
    rango_sueldo: [''],
  });

  constructor() {
    this.cargar();
  }

  get situacionActual(): Situacion | undefined {
    return this.egresado()?.situaciones.find((s) => s.es_actual);
  }

  get correoPrincipal(): string {
    const correos = this.egresado()?.correos ?? [];
    return (correos.find((c) => c.es_principal) ?? correos[0])?.correo ?? '—';
  }

  private cargar(): void {
    this.http.get<Egresado>(`${API_URL}/egresados/me`).subscribe({
      next: (e) => {
        this.egresado.set(e);
        this.cargando.set(false);
        const tel = e.telefonos.find((t) => t.es_principal) ?? e.telefonos[0];
        const sit = e.situaciones.find((s) => s.es_actual);
        this.form.reset({
          apellido_materno: e.apellido_materno ?? '',
          ciudad_residencia: e.ciudad_residencia ?? '',
          telefono: tel?.telefono ?? '',
          estado_laboral: sit?.estado_laboral ?? 'EMPLEADO',
          empresa: sit?.empresa ?? '',
          cargo: sit?.cargo ?? '',
          rango_sueldo: sit?.rango_sueldo ?? '',
        });
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(mensajeError(err, 'No fue posible cargar tu perfil.'));
      },
    });
  }

  guardar(): void {
    const e = this.egresado();
    if (!e) return;

    this.mensajeOk.set(null);
    this.error.set(null);
    this.guardando.set(true);

    const v = this.form.getRawValue();
    const base = `${API_URL}/egresados/${e.id_egresado}`;
    const peticiones: Observable<unknown>[] = [];

    if (v.apellido_materno !== (e.apellido_materno ?? '') || v.ciudad_residencia !== (e.ciudad_residencia ?? '')) {
      peticiones.push(
        this.http.patch(`${API_URL}/egresados/me`, {
          apellido_materno: v.apellido_materno || undefined,
          ciudad_residencia: v.ciudad_residencia || undefined,
        }),
      );
    }

    const tel = e.telefonos.find((t) => t.es_principal) ?? e.telefonos[0];
    const telefono = v.telefono.trim();
    if (telefono && telefono !== tel?.telefono) {
      peticiones.push(
        tel
          ? this.http.patch(`${base}/telefonos/${tel.id_telefono}`, { telefono })
          : this.http.post(`${base}/telefonos`, { telefono, es_principal: true }),
      );
    }

    const sit = this.situacionActual;
    const cambioSituacion =
      !sit ||
      sit.estado_laboral !== v.estado_laboral ||
      (sit.empresa ?? '') !== v.empresa ||
      (sit.cargo ?? '') !== v.cargo ||
      (sit.rango_sueldo ?? '') !== v.rango_sueldo;
    if (cambioSituacion) {
      peticiones.push(
        this.http.post(`${base}/situaciones-laborales`, {
          estado_laboral: v.estado_laboral,
          empresa: v.empresa || undefined,
          cargo: v.cargo || undefined,
          rango_sueldo: v.rango_sueldo || undefined,
        }),
      );
    }

    const guardado$: Observable<unknown> = peticiones.length ? forkJoin(peticiones) : of(null);
    guardado$.subscribe({
      next: () => {
        this.guardando.set(false);
        this.mensajeOk.set(peticiones.length ? 'Perfil actualizado.' : 'No había cambios que guardar.');
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err, 'No fue posible guardar los cambios.'));
      },
    });
  }
}
