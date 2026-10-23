import { Component } from '@angular/core';

@Component({
  selector: 'app-jefatura-inicio',
  standalone: true,
  template: `
    <h1 class="titulo">Panel de métricas de egresados</h1>
    <p class="subtitulo">
      Evidencia cuantitativa para el proceso de acreditación de ICCI
    </p>

    <section class="metricas">
      @for (m of metricas; track m.titulo) {
        <article class="card">
          <p class="card__label">{{ m.titulo }}</p>
          <p class="card__valor">{{ m.valor }}</p>
          <p class="card__detalle">{{ m.detalle }}</p>
        </article>
      }
    </section>

    <article class="card aviso">
      Los gráficos de empleabilidad, rangos de sueldo y demografía se agregan en
      la siguiente etapa.
    </article>
  `,
  styles: [
    `
      .titulo {
        font-size: 1.6rem;
        font-weight: 800;
        color: #14223b;
        margin: 0;
      }
      .subtitulo {
        font-size: 0.9rem;
        color: #5b6577;
        margin: 4px 0 22px;
      }
      .metricas {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-bottom: 16px;
      }
      .card {
        background: #fff;
        border: 1px solid #e3e6ec;
        border-radius: 12px;
        padding: 20px;
      }
      .card__label {
        font-size: 0.85rem;
        color: #5b6577;
        margin: 0;
      }
      .card__valor {
        font-size: 2rem;
        font-weight: 800;
        color: #14223b;
        margin: 6px 0 4px;
      }
      .card__detalle {
        font-size: 0.78rem;
        color: #1f8a52;
        margin: 0;
      }
      .aviso {
        font-size: 0.88rem;
        color: #5b6577;
      }
      @media (max-width: 900px) {
        .metricas {
          grid-template-columns: 1fr 1fr;
        }
      }
    `,
  ],
})
export class JefaturaInicioComponent {
  readonly metricas = [
    {
      titulo: 'Egresados en directorio',
      valor: '1.248',
      detalle: '100% de la BD',
    },
    { titulo: 'Empleabilidad', valor: '87%', detalle: '+3 pp vs 2025' },
    { titulo: 'Empleo en el área', valor: '78%', detalle: 'de los empleados' },
    { titulo: 'Meses al 1er empleo', valor: '4,2', detalle: '-0,6 vs 2025' },
    {
      titulo: 'Participación en actividades',
      valor: '31%',
      detalle: 'egresados que asistieron',
    },
    {
      titulo: 'Respuesta a encuestas',
      valor: '64%',
      detalle: 'de los encuestados',
    },
  ];
}
