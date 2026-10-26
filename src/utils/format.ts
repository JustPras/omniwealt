// Currency, percentage, and date formatting utilities
import { CurrencyMode } from '../types';

export function formatUSD(amountInIdr: number, usdRate: number = 16250, compact: boolean = false): string {
  const isNegative = amountInIdr < 0;
  const absIdr = Math.abs(amountInIdr);
  const amountUsd = absIdr / (usdRate > 0 ? usdRate : 16250);

  if (compact && amountUsd >= 1_000_000_000) {
    const val = (amountUsd / 1_000_000_000).toFixed(2);
    return `${isNegative ? '−' : ''}$ ${val}B`;
  }
  if (compact && amountUsd >= 1_000_000) {
    const val = (amountUsd / 1_000_000).toFixed(2);
    return `${isNegative ? '−' : ''}$ ${val}M`;
  }
  if (compact && amountUsd >= 1_000) {
    const val = (amountUsd / 1_000).toFixed(1);
    return `${isNegative ? '−' : ''}$ ${val}K`;
  }

  const fractionDigits = amountUsd >= 100 ? 2 : amountUsd >= 1 ? 2 : 4;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: fractionDigits,
  }).format(amountUsd);

  return `${isNegative ? '−' : ''}$ ${formatted}`;
}

export function formatCurrency(
  amountInIdr: number,
  currency: CurrencyMode = 'IDR',
  usdRate: number = 16250,
  compact: boolean = false
): string {
  if (currency === 'USD') {
    return formatUSD(amountInIdr, usdRate, compact);
  }
  return formatIDR(amountInIdr, compact);
}

export function formatIDR(amount: number, compact: boolean = false): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  if (compact && absAmount >= 1_000_000_000) {
    const val = (absAmount / 1_000_000_000).toFixed(2).replace('.', ',');
    return `${isNegative ? '−' : ''}Rp ${val} M`;
  }
  if (compact && absAmount >= 1_000_000) {
    const val = (absAmount / 1_000_000).toFixed(2).replace('.', ',');
    return `${isNegative ? '−' : ''}Rp ${val} jt`;
  }

  const rounded = Math.round(absAmount);
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(rounded);

  return `${isNegative ? '−' : ''}Rp ${formatted}`;
}

export function formatPercent(rate: number): string {
  const percent = rate * 100;
  const isPositive = percent > 0;
  const isNegative = percent < 0;
  const sign = isPositive ? '+' : isNegative ? '−' : '';
  const val = Math.abs(percent).toFixed(2).replace('.', ',');
  return `${sign}${val}%`;
}

export function formatChangePercent(rate: number): string {
  const percent = rate * 100;
  const val = Math.abs(percent).toFixed(2).replace('.', ',');
  if (percent > 0) {
    return `▲ +${val}%`;
  }
  if (percent < 0) {
    return `▼ −${val}%`;
  }
  return `0,00%`;
}

export function formatChangeIDR(amount: number, compact: boolean = false): string {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const formatted = formatIDR(Math.abs(amount), compact);
  if (isPositive) {
    return `▲ +${formatted}`;
  }
  if (isNegative) {
    return `▼ −${formatted}`;
  }
  return formatted;
}

export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}
