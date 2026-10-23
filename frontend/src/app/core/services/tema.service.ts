import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

export type Tema = 'claro' | 'oscuro';

const CLAVE_TEMA = 'sse_tema';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly document = inject(DOCUMENT);

  readonly tema = signal<Tema>(this.leerGuardado());

  constructor() {
    effect(() => {
      const tema = this.tema();
      this.document.documentElement.setAttribute('data-tema', tema);
      try {
        localStorage.setItem(CLAVE_TEMA, tema);
      } catch {}
    });
  }

  alternar(): void {
    this.tema.update((t) => (t === 'oscuro' ? 'claro' : 'oscuro'));
  }

  // Sin preferencia guardada, sigue la configuración del sistema operativo.
  private leerGuardado(): Tema {
    try {
      const guardado = localStorage.getItem(CLAVE_TEMA);
      if (guardado === 'claro' || guardado === 'oscuro') return guardado;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
    } catch {
      return 'claro';
    }
  }
}
