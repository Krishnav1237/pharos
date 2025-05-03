// Format a number to a specific number of decimal places
export const formatNumber = (
  value: number | string,
  decimals: number = 2,
  options: { groupSeparator?: boolean; minimumFractionDigits?: number } = {}
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  const { groupSeparator = true, minimumFractionDigits } = options;
  
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: minimumFractionDigits ?? decimals,
    maximumFractionDigits: decimals,
    useGrouping: groupSeparator,
  });
};

// Format currency values (e.g. USD)
export const formatCurrency = (
  value: number | string,
  currency: string = 'USD',
  decimals: number = 2
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return `${currency} 0`;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
};

// Format percentage values
export const formatPercent = (
  value: number | string,
  decimals: number = 2,
  includeSign: boolean = false
): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0%';
  
  const formatted = Math.abs(numValue).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  const sign = includeSign && numValue > 0 ? '+' : '';
  const prefix = numValue < 0 ? '-' : sign;
  
  return `${prefix}${formatted}%`;
};

// Format a timestamp to a date string
export const formatDate = (
  timestamp: number,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string => {
  // Convert seconds to milliseconds if needed
  const timestampMs = timestamp > 1000000000000 ? timestamp : timestamp * 1000;
  
  return new Date(timestampMs).toLocaleDateString('en-US', options);
};

// Format a timestamp to include date and time
export const formatDateTime = (
  timestamp: number,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string => {
  // Convert seconds to milliseconds if needed
  const timestampMs = timestamp > 1000000000000 ? timestamp : timestamp * 1000;
  
  return new Date(timestampMs).toLocaleString('en-US', options);
};

// Format a timestamp as "time ago" (e.g. "2 hours ago")
export const formatTimeAgo = (timestamp: number): string => {
  // Convert seconds to milliseconds if needed
  const timestampMs = timestamp > 1000000000000 ? timestamp : timestamp * 1000;
  
  const seconds = Math.floor((Date.now() - timestampMs) / 1000);
  
  let interval = Math.floor(seconds / 31536000); // years
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }
  
  interval = Math.floor(seconds / 2592000); // months
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }
  
  interval = Math.floor(seconds / 86400); // days
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600); // hours
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }
  
  interval = Math.floor(seconds / 60); // minutes
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }
  
  return seconds < 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
};

// Truncate address for display
export const formatAddress = (address: string, length: number = 4): string => {
  if (!address || address.length < 10) return address || '';
  return `${address.substring(0, length + 2)}...${address.substring(address.length - length)}`;
};

// Format large numbers with abbreviations (K, M, B)
export const formatCompactNumber = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(numValue);
};