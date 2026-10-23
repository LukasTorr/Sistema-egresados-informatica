import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

function limpiarRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, '').toUpperCase();
}

function calcularDv(cuerpo: string): string {
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

export function rutValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value as string | null;
    if (!valor) return null;

    const limpio = limpiarRut(valor);
    if (!/^\d{7,8}[0-9K]$/.test(limpio)) {
      return { rutInvalido: true };
    }

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);

    return calcularDv(cuerpo) === dv ? null : { rutInvalido: true };
  };
}

export function formatearRut(valor: string): string {
  const limpio = limpiarRut(valor);
  if (limpio.length <= 1) return limpio;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${cuerpoFormateado}-${dv}`;
}
