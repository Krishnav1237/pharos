import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format a currency value with a currency symbol 
export function formatCurrency(
  value: number | string, 
  currency: string = 'USD', 
  minimumFractionDigits: number = 2,
  maximumFractionDigits: number = 2
): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return `$0.00`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericValue);
}

// Format a percentage value with a percent symbol
export function formatPercent(
  value: number | string,
  decimals: number = 2,
  includeSign: boolean = false
): string {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return '0%';
  }
  
  const formatted = Math.abs(numericValue).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  const sign = includeSign && numericValue > 0 ? '+' : '';
  const prefix = numericValue < 0 ? '-' : sign;
  
  return `${prefix}${formatted}%`;
}

// Format an Ethereum address for display by truncating the middle
export function formatAddress(address: string, startLength: number = 6, endLength: number = 4): string {
  if (!address || address.length < (startLength + endLength + 3)) {
    return address || '';
  }
  
  return `${address.substring(0, startLength)}...${address.substring(address.length - endLength)}`;
}

// Format a date and time using the Intl.DateTimeFormat API
export function formatDateTime(
  timestamp: number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string {
  // Convert seconds to milliseconds if needed
  const timestampMs = timestamp > 1000000000000 ? timestamp : timestamp * 1000;
  
  return new Date(timestampMs).toLocaleString('en-US', options);
}

// Check if an Ethereum address is valid
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}