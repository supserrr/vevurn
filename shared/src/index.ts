export * from './types';
export * from './validation';

// Utility functions
export const formatCurrency = (amount: number, currency: string = 'RWF'): string => {
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    short: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    },
    medium: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    },
    long: { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }
  }[format];

  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

export const generateSaleNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  
  return `VEV${year}${month}${day}${timestamp}`;
};

export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits for uniqueness
  
  return `INV-${year}-${timestamp}`;
};

export const calculateDiscount = (price: number, discountPercent: number): number => {
  return price * (discountPercent / 100);
};

export const calculateTax = (price: number, taxPercent: number): number => {
  return price * (taxPercent / 100);
};

export const validatePhone = (phone: string): boolean => {
  // Rwanda phone number validation (supports both local and international formats)
  const rwandaPhoneRegex = /^(\+?25)?(078|072|073|079)[0-9]{7}$/;
  return rwandaPhoneRegex.test(phone.replace(/\s/g, ''));
};

export const formatPhone = (phone: string): string => {
  // Format phone number to international format
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('25')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+25${cleaned}`;
  } else if (cleaned.length === 9) {
    return `+250${cleaned}`;
  }
  
  return phone;
};

export const generateBarcode = (length: number = 13): string => {
  const digits = '0123456789';
  let result = '';
  
  for (let i = 0; i < length - 1; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  
  // Calculate check digit (simplified EAN-13 algorithm)
  let oddSum = 0;
  let evenSum = 0;
  
  for (let i = 0; i < result.length; i++) {
    const digit = parseInt(result[i]);
    if (i % 2 === 0) {
      oddSum += digit;
    } else {
      evenSum += digit;
    }
  }
  
  const checkDigit = (10 - ((oddSum + evenSum * 3) % 10)) % 10;
  result += checkDigit.toString();
  
  return result;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
