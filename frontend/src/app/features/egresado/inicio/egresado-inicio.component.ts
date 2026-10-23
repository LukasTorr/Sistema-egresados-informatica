import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-egresado-inicio',
  standalone: true,
  template: `
    <h1 class="titulo">Hola, {{ auth.usuarioActual()?.nombres }}</h1>
    <p class="subtitulo">
      Novedades del Departamento de Ingeniería en Computación e Informática
    </p>

    <div class="banner">
      <div>
        <p class="banner__titulo">
          Tu situación laboral no se actualiza hace 7 meses
        </p>
        <p class="banner__texto">
          Mantener tu perfil al día ayuda a la carrera en su proceso de
          acreditación y te permite recibir ofertas pertinentes.
        </p>
      </div>
    </div>

    <article class="card">
      <h2 class="card__titulo">Comunicaciones del departamento</h2>
      <ul class="lista">
        @for (c of comunicaciones; track c.titulo) {
          <li class="item">
            <p class="item__titulo">{{ c.titulo }}</p>
            <p class="item__meta">{{ c.meta }}</p>
            <p class="item__texto">{{ c.texto }}</p>
          </li>
        }
      </ul>
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
      .banner {
        background: #faf1d9;
        border-radius: 12px;
        padding: 18px 22px;
        margin-bottom: 18px;
      }
      .banner__titulo {
        font-weight: 700;
        color: #b9740a;
        margin: 0 0 4px;
      }
      .banner__texto {
        font-size: 0.88rem;
        color: #5b6577;
        margin: 0;
      }
      .card {
        background: #fff;
        border: 1px solid #e3e6ec;
        border-radius: 12px;
        padding: 22px;
      }
      .card__titulo {
        font-size: 1.05rem;
        font-weight: 700;
        color: #14223b;
        margin: 0 0 14px;
      }
      .lista {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .item {
        background: #f1f5fb;
        border-radius: 10px;
        padding: 14px 16px;
      }
      .item__titulo {
        font-weight: 700;
        color: #14223b;
        margin: 0;
      }
      .item__meta {
        font-size: 0.75rem;
        color: #5b6577;
        margin: 2px 0 6px;
      }
      .item__texto {
        font-size: 0.86rem;
        color: #14223b;
        margin: 0;
      }
    `,
  ],
})
export class EgresadoInicioComponent {
  readonly auth = inject(AuthService);

  readonly comunicaciones = [
    {
      titulo: 'Invitación: Encuentro de egresados 2026',
      meta: 'Hoy · Secretaría DICI',
      texto:
        'Te invitamos al Encuentro de Egresados ICCI 2026, el 5 de noviembre en Campus Saucache.',
    },
    {
      titulo: 'Encuesta de empleabilidad 2026',
      meta: '02/10 · Jefatura de Carrera',
      texto:
        'Tu opinión nos ayuda a ajustar el perfil de egreso. Toma menos de 5 minutos.',
    },
    {
      titulo: 'Nueva oferta: Analista de datos en Puerto Arica',
      meta: '28/09 · Secretaría DICI',
      texto: 'Se publicó una nueva oportunidad laboral acorde a tu área.',
    },
  ];
}
