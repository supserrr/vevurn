import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency (Rwandan Franc)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string | null | undefined): string {
  // Handle null, undefined, or empty string
  if (!dateString || dateString.trim() === '') {
    return 'N/A';
  }

  // Create date object and check if it's valid
  const date = new Date(dateString);
  
  // Check if date is invalid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return new Intl.DateTimeFormat('en-RW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Format a date and time string for display
 */
export function formatDateTime(dateString: string | null | undefined): string {
  // Handle null, undefined, or empty string
  if (!dateString || dateString.trim() === '') {
    return 'N/A';
  }

  // Create date object and check if it's valid
  const date = new Date(dateString);
  
  // Check if date is invalid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  return new Intl.DateTimeFormat('en-RW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-RW').format(num);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}
