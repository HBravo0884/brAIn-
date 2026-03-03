// Integer-cents financial arithmetic — avoids floating-point errors (0.1 + 0.2 !== 0.3)

export const toCents = (dollarValue) =>
  Math.round(parseFloat(dollarValue ?? 0) * 100);

export const fromCents = (cents) =>
  cents / 100;

export const sumCents = (...amounts) =>
  amounts.reduce((acc, v) => acc + toCents(v), 0);

export const formatUSD = (dollarAmount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dollarAmount ?? 0);
