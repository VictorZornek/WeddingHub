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
