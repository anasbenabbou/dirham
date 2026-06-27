/** Money + number formatting, centralized so every screen reads identically. */

export function fmtMAD(n: number, digits = 0): string {
  return n.toLocaleString('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Signed money, e.g. "+12 000 MAD" / "-450 MAD" */
export function fmtSigned(n: number, digits = 0): string {
  return (n >= 0 ? '+' : '−') + fmtMAD(Math.abs(n), digits);
}

export function fmtNum(n: number, digits = 2): string {
  return n.toLocaleString('fr-MA', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtPct(n: number, digits = 1): string {
  return (n >= 0 ? '+' : '') + n.toFixed(digits) + '%';
}
