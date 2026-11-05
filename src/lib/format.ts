// Formats 1234.5 as "R$ 1.234,50" without relying on Intl support.
export function formatCurrency(value: number, { cents = false } = {}) {
  const negative = value < 0;
  const fixed = Math.abs(value).toFixed(cents ? 2 : 0);
  const [integer, decimals] = fixed.split('.');
  const withDots = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const text = decimals ? `${withDots},${decimals}` : withDots;
  return `${negative ? '-' : ''}R$ ${text}`;
}

export function formatPercent(ratio: number) {
  return `${Math.round(ratio * 100)}%`;
}

// Value shown inside a money input: 29000 -> "29.000,00", null -> "".
export function toMoneyInput(value: number | null) {
  return value === null ? '' : formatCurrency(value, { cents: true }).replace('R$ ', '');
}

// Reads what the user typed in a money input. "" -> null, invalid -> NaN.
// Accepts "29000", "29.000", "29.000,50", "R$ 1.600" and "1600.5".
export function parseMoneyInput(text: string): number | null {
  const clean = text.replace(/R\$|\s/g, '');
  if (!clean) return null;
  // Comma present: Brazilian format, dots are thousands separators.
  // No comma: a single dot followed by 1-2 digits is a decimal point.
  const normalized = clean.includes(',')
    ? clean.replace(/\./g, '').replace(',', '.')
    : /^\d+\.\d{1,2}$/.test(clean)
      ? clean
      : clean.replace(/\./g, '');
  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}

// Formats a money input while typing: "10000" -> "10.000", "10000,5" -> "10.000,5".
// A trailing "." typed by the user (some keyboards) becomes the decimal comma.
export function maskMoney(text: string) {
  let value = text.replace(/[^\d.,]/g, '');
  if (!value.includes(',') && value.endsWith('.')) value = `${value.slice(0, -1)},`;

  const [rawInteger, ...rest] = value.split(',');
  const integer = rawInteger.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
  const withDots = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (rest.length === 0) return withDots;
  const decimals = rest.join('').replace(/\D/g, '').slice(0, 2);
  return `${withDots || '0'},${decimals}`;
}

// Formats a date string "2027-03-15" as "15/03/2027".
export function formatDate(isoDate: string) {
  const [year, month, day] = isoDate.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}
