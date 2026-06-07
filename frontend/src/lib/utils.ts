import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercentage(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(2)}%`;
}

export function formatDecimal(value: number, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return value.toFixed(decimals);
}

export function formatCurrency(value: number): string {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function getRiskLevel(volatility: number): {
  level: 'Low' | 'Moderate' | 'High' | 'Very High';
  color: string;
} {
  if (volatility < 0.15) {
    return { level: 'Low', color: 'text-green-600' };
  } else if (volatility < 0.25) {
    return { level: 'Moderate', color: 'text-yellow-600' };
  } else if (volatility < 0.35) {
    return { level: 'High', color: 'text-orange-600' };
  } else {
    return { level: 'Very High', color: 'text-red-600' };
  }
}

export function getSharpeRating(sharpe: number): {
  rating: 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent';
  color: string;
} {
  if (sharpe < 0) {
    return { rating: 'Poor', color: 'text-red-600' };
  } else if (sharpe < 0.5) {
    return { rating: 'Fair', color: 'text-yellow-600' };
  } else if (sharpe < 1) {
    return { rating: 'Good', color: 'text-blue-600' };
  } else if (sharpe < 2) {
    return { rating: 'Very Good', color: 'text-green-600' };
  } else {
    return { rating: 'Excellent', color: 'text-emerald-600' };
  }
}
