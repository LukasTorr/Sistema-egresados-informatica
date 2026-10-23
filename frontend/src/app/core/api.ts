export const API_URL = 'http://localhost:3000/api';

export function mensajeError(err: any, porDefecto: string): string {
  const msg = err?.error?.message;
  if (Array.isArray(msg)) return msg.join('. ');
  if (typeof msg === 'string') return msg;
  if (err?.status === 0) return 'No se pudo conectar con el servidor. ¿Está corriendo el backend?';
  return porDefecto;
}
