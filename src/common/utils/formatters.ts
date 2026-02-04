export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatMonthLabel(monthsFromNow: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthsFromNow);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function formatCompactCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return formatCurrency(value);
}
