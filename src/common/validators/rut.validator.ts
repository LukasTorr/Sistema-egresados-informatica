import { registerDecorator, ValidationOptions } from 'class-validator';

/** Deja el RUT como "12345678-9" (sin puntos, DV en mayúscula). */
export function normalizarRut(rut: string): string {
  const limpio = String(rut).replace(/[.\s-]/g, '').toUpperCase();
  if (limpio.length < 2) return limpio;
  return `${limpio.slice(0, -1)}-${limpio.slice(-1)}`;
}

/** Valida el dígito verificador de un RUT chileno. */
export function esRutValido(rut: string): boolean {
  if (typeof rut !== 'string') return false;
  const [cuerpo, dv] = normalizarRut(rut).split('-');
  if (!cuerpo || !dv || !/^\d{7,8}$/.test(cuerpo)) return false;

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dv === dvEsperado;
}

export function IsRut(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isRut',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} no es un RUT válido`,
        ...validationOptions,
      },
      validator: { validate: (value: unknown) => esRutValido(value as string) },
    });
}
