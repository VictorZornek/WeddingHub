// Date helpers. Dates are stored as "AAAA-MM-DD" strings (Postgres date).

// Turns "DD/MM/AAAA" into "AAAA-MM-DD". Returns null when invalid.
export function parseBrazilianDate(value: string): string | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const isRealDate =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);
  return isRealDate ? `${year}-${month}-${day}` : null;
}

// Adds the slashes while typing: 15032027 -> 15/03/2027.
export function maskDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Adds the colon while typing: 0930 -> 09:30.
export function maskTime(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

// "AAAA-MM-DD" + "HH:MM" -> local Date. Returns null when the time is invalid.
export function combineDateTime(isoDate: string, time: string): Date | null {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [hours, minutes] = [Number(match[1]), Number(match[2])];
  if (hours > 23 || minutes > 59) return null;
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso() {
  return toIsoDate(new Date());
}

// Same day N months later; the 31st becomes the last day of shorter months.
export function addMonths(isoDate: string, months: number) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const target = new Date(year, month - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return toIsoDate(target);
}

// Date -> "15/03/2027"
export function toBrazilianDate(date: Date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

// Date -> "09:30"
export function toTime(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Date -> "15/03/2027 às 09:30"
export function formatDateTime(date: Date) {
  return `${toBrazilianDate(date)} às ${toTime(date)}`;
}
