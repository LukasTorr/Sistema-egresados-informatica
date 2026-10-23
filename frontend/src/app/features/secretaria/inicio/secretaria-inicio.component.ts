import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-secretaria-inicio',
  standalone: true,
  templateUrl: './secretaria-inicio.component.html',
  styleUrl: './secretaria-inicio.component.css',
})
export class SecretariaInicioComponent {
  readonly auth = inject(AuthService);

  readonly metricas = [
    {
      titulo: 'Egresados registrados',
      valor: '1.248',
      detalle: '+36 este mes',
      tono: 'ok',
    },
    {
      titulo: 'Perfiles completos',
      valor: '812',
      detalle: '65% del directorio',
      tono: 'ok',
    },
    {
      titulo: 'Perfiles desactualizados',
      valor: '436',
      detalle: 'Más de 12 meses sin actualizar',
      tono: 'warn',
    },
    {
      titulo: 'Actividades del semestre',
      valor: '9',
      detalle: '3 próximas · 2 con encuesta pendiente',
      tono: 'info',
    },
  ];

  readonly desactualizados = [
    {
      nombre: 'Diego Fuentes Mamani',
      cohorte: '2018',
      ultima: '14/03/2024',
      estado: 'Desactualizado',
      tono: 'warn',
    },
    {
      nombre: 'Valentina Choque Ríos',
      cohorte: '2019',
      ultima: '02/08/2024',
      estado: 'Desactualizado',
      tono: 'warn',
    },
    {
      nombre: 'Matías Gutiérrez López',
      cohorte: '2016',
      ultima: '—',
      estado: 'Sin datos laborales',
      tono: 'danger',
    },
    {
      nombre: 'Fernanda Quispe Araya',
      cohorte: '2020',
      ultima: '21/01/2025',
      estado: 'Desactualizado',
      tono: 'warn',
    },
    {
      nombre: 'Ignacio Vargas Tapia',
      cohorte: '2017',
      ultima: '09/11/2024',
      estado: 'Desactualizado',
      tono: 'warn',
    },
  ];

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
