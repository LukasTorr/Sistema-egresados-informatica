import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';

import { API_URL } from '../../../core/api';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-secretaria-inicio',
  standalone: true,
  templateUrl: './secretaria-inicio.component.html',
  styleUrl: './secretaria-inicio.component.css',
})
export class SecretariaInicioComponent {
  readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);

  readonly metricas = signal([
    { titulo: 'Egresados registrados', valor: '…', detalle: 'En el directorio', tono: 'ok' },
    { titulo: 'Perfiles completos', valor: '…', detalle: '', tono: 'ok' },
    { titulo: 'Perfiles incompletos', valor: '…', detalle: 'Faltan datos por completar', tono: 'warn' },
    {
      titulo: 'Actividades del semestre',
      valor: '9',
      detalle: '3 próximas · 2 con encuesta pendiente',
      tono: 'info',
    },
  ]);

  readonly desactualizados = signal<
    { nombre: string; cohorte: string; ultima: string; estado: string; tono: string }[]
  >([]);

  constructor() {
    const contar = (estado?: string) =>
      this.http.get<{ total: number; datos: any[] }>(`${API_URL}/egresados`, {
        params: estado ? { estado_perfil: estado, por_pagina: 5 } : { por_pagina: 1 },
      });

    forkJoin([contar(), contar('ACTIVO'), contar('INCOMPLETO')]).subscribe({
      next: ([todos, activos, incompletos]) => {
        const pct = todos.total ? Math.round((activos.total / todos.total) * 100) : 0;
        this.metricas.update((m) => [
          { ...m[0], valor: todos.total.toLocaleString('es-CL') },
          { ...m[1], valor: activos.total.toLocaleString('es-CL'), detalle: `${pct}% del directorio` },
          { ...m[2], valor: incompletos.total.toLocaleString('es-CL') },
          m[3],
        ]);
        this.desactualizados.set(
          incompletos.datos.map((e) => ({
            nombre: [e.nombres, e.apellido_paterno, e.apellido_materno].filter(Boolean).join(' '),
            cohorte: e.anio_egreso ? String(e.anio_egreso) : '—',
            ultima: new Date(e.fecha_actualizacion).toLocaleDateString('es-CL'),
            estado: e.situaciones?.length ? 'Perfil incompleto' : 'Sin datos laborales',
            tono: e.situaciones?.length ? 'warn' : 'danger',
          })),
        );
      },
    });
  }

  readonly actividades = [
    {
      dia: '15',
      mes: 'OCT',
      titulo: 'Charla: IA aplicada en la industria',
      detalle: 'Auditorio DICI · 40/60 inscritos',
    },
    {
      dia: '22',
      mes: 'OCT',
      titulo: 'Taller de ciberseguridad',
      detalle: 'Online · 28/50 inscritos',
    },
    {
      dia: '05',
      mes: 'NOV',
      titulo: 'Encuentro de egresados 2026',
      detalle: 'Campus Saucache · 112/150 inscritos',
    },
  ];

  readonly accesos = [
    'Carga masiva desde Registraduría',
    'Publicar oferta laboral',
    'Agendar actividad',
    'Ver informes de cierre',
  ];
}
