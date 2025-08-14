import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Decimal } from "decimal.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency for Rwanda (RWF)
 */
export function formatCurrency(amount: number | string | Decimal): string {
  const value = new Decimal(amount).toNumber();
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format currency without symbol
 */
export function formatAmount(amount: number | string | Decimal): string {
  const value = new Decimal(amount).toNumber();
  return new Intl.NumberFormat('rw-RW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format date for Rwanda timezone
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-RW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Africa/Kigali',
  }).format(dateObj);
}

/**
 * Format datetime for Rwanda timezone
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-RW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Kigali',
  }).format(dateObj);
}

/**
 * Format phone number for Rwanda
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('250')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `+250 ${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * Validate Rwanda phone number
 */
export function isValidRwandaPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^(250|0)?[27]\d{8}$/.test(cleaned);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number | Decimal, total: number | Decimal): number {
  const val = new Decimal(value);
  const tot = new Decimal(total);
  
  if (tot.isZero()) return 0;
  
  return val.div(tot).mul(100).toNumber();
}

/**
 * Calculate profit margin
 */
export function calculateProfitMargin(sellingPrice: number | Decimal, costPrice: number | Decimal): number {
  const selling = new Decimal(sellingPrice);
  const cost = new Decimal(costPrice);
  
  if (cost.isZero()) return 0;
  
  return selling.sub(cost).div(cost).mul(100).toNumber();
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Sleep function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Parse error message
 */
export function parseErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  if (error?.response?.data?.message) return error.response.data.message;
  return 'An unexpected error occurred';
}

/**
 * Convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      if (result && result.includes(',')) {
        const base64 = result.split(',')[1];
        if (base64) {
          resolve(base64); // Remove data URL prefix
        } else {
          reject(new Error('Failed to extract base64 data'));
        }
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Download file from blob
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

/**
 * Get payment method color
 */
export function getPaymentMethodColor(method: string): string {
  switch (method.toLowerCase()) {
    case 'cash':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'mobile_money':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    case 'bank_transfer':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'credit':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'active':
    case 'successful':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'pending':
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'failed':
    case 'cancelled':
    case 'inactive':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'refunded':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
}
