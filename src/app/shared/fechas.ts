/** Fecha local en formato yyyy-MM-dd. */
export function diaLocal(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function esHoy(fecha: string): boolean {
  return diaLocal(fecha) === diaLocal(new Date());
}

/**
 * Deja una fecha del catálogo en el formato que espera el servicio
 * de citas: yyyy-MM-ddTHH:mm:ss (hora local, sin zona).
 */
export function aFechaCita(valor: string): string {
  const base = valor.substring(0, 19);
  return base.length === 16 ? `${base}:00` : base;
}

/** Saludo según la hora del día. */
export function saludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 20) return 'Buenas tardes';
  return 'Buenas noches';
}
