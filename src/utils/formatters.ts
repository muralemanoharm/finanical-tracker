import { format, parseISO, isValid } from 'date-fns';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrFormatterDecimal = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export function formatINR(value: number | null | undefined, withDecimals = false): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '₹0';
  return withDecimals ? inrFormatterDecimal.format(value) : inrFormatter.format(value);
}

/** Compact Indian units: ₹1,23,456 or in Lakh/Crore for big numbers, used in KPI cards. */
export function formatINRCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '₹0';
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(2)} L`;
  return formatINR(value);
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(iso: string | null | undefined, pattern = 'dd MMM yyyy'): string {
  if (!iso) return '—';
  const d = parseISO(iso);
  if (!isValid(d)) return '—';
  return format(d, pattern);
}

export function safeNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
}
