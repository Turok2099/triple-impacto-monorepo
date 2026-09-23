/**
 * Suma un mes a una fecha, ajustando (clamp) al último día del mes destino
 * cuando el día original no existe ahí (ej: 31/ene -> 28 o 29/feb, no 3/mar).
 */
export function addOneMonthClamped(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const lastDayOfNextMonth = new Date(year, month + 2, 0).getDate();
  const clampedDay = Math.min(day, lastDayOfNextMonth);

  return new Date(year, month + 1, clampedDay);
}
