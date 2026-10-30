import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { API_URL, mensajeError } from '../../../core/api';
import { NotificacionesService } from '../../../core/services/notificaciones.service';

interface Especialidad {
  id_especialidad: number;
  nombre: string;
}

interface Comunicacion {
  id_comunicacion: number;
  titulo: string;
  contenido: string;
  fecha_publicacion: string;
  total_destinatarios: number;
  especialidad: Especialidad | null;
  anio_egreso: number | null;
}

@Component({
  selector: 'app-comunicaciones',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './comunicaciones.component.html',
  styleUrls: ['../registrar/registrar-egresado.component.css', './comunicaciones.component.css'],
})
export class ComunicacionesComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly notificaciones = inject(NotificacionesService);

  readonly especialidades = signal<Especialidad[]>([]);
  readonly publicadas = signal<Comunicacion[]>([]);
  readonly enviando = signal(false);
  readonly intentoFallido = signal(false);
  readonly mensajeOk = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    contenido: ['', Validators.required],
    id_especialidad: [''],
    anio_egreso: [''],
  });

  constructor() {
    this.http.get<Especialidad[]>(`${API_URL}/especialidades`).subscribe((e) => this.especialidades.set(e));
    this.cargarPublicadas();
  }

  invalido(campo: 'titulo' | 'contenido'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || this.intentoFallido());
  }

  destinatarios(c: Comunicacion): string {
    const filtros = [c.especialidad?.nombre, c.anio_egreso ? `egreso ${c.anio_egreso}` : null].filter(Boolean);
    return filtros.length ? filtros.join(' · ') : 'Todos los egresados';
  }

  fecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  publicar(): void {
    this.mensajeOk.set(null);
    this.error.set(null);
    if (this.form.invalid) {
      this.intentoFallido.set(true);
      return;
    }

    const v = this.form.getRawValue();
    this.enviando.set(true);
    this.http
      .post<Comunicacion>(`${API_URL}/comunicaciones`, {
        titulo: v.titulo,
        contenido: v.contenido,
        id_especialidad: v.id_especialidad ? Number(v.id_especialidad) : undefined,
        anio_egreso: v.anio_egreso ? Number(v.anio_egreso) : undefined,
      })
      .subscribe({
        next: (c) => {
          this.enviando.set(false);
          this.intentoFallido.set(false);
          this.form.reset();
          this.mensajeOk.set(`Comunicación publicada para ${c.total_destinatarios} egresado(s).`);
          this.cargarPublicadas();
          this.notificaciones.cargar();
        },
        error: (err) => {
          this.enviando.set(false);
          this.error.set(mensajeError(err, 'No fue posible publicar la comunicación.'));
        },
      });
  }

  private cargarPublicadas(): void {
    this.http
      .get<{ datos: Comunicacion[] }>(`${API_URL}/comunicaciones`, { params: { por_pagina: 10 } })
      .subscribe((res) => this.publicadas.set(res.datos));
  }
}
