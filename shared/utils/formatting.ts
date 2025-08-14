// Number formatting utilities
export function formatCurrency(
  amount: number,
  currency: string = 'RWF',
  locale: string = 'rw-RW'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(
  value: number,
  locale: string = 'rw-RW',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatPercent(value: number, locale: string = 'rw-RW'): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

// Phone number formatting utilities
export function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle Rwanda phone numbers
  if (cleaned.startsWith('250')) {
    // +250 XXX XXX XXX format
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  } else if (cleaned.length === 9 && /^(078|072|073|079)/.test(cleaned)) {
    // 078 XXX XXX format for local numbers
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  
  return phone; // Return original if no pattern matches
}

export function normalizePhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Add country code if missing
  if (cleaned.length === 9 && /^(078|072|073|079)/.test(cleaned)) {
    return `250${cleaned}`;
  }
  
  // Remove leading + if present
  if (cleaned.startsWith('250')) {
    return cleaned;
  }
  
  return cleaned;
}

// Text formatting utilities
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function camelToTitle(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, char => char.toUpperCase())
    .trim();
}

// File size formatting
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Business-specific formatters
export function formatSKU(sku: string): string {
  return sku.toUpperCase().replace(/[^A-Z0-9-_]/g, '');
}

export function formatBarcode(barcode: string): string {
  // Remove any non-digit characters
  const cleaned = barcode.replace(/\D/g, '');
  
  // Format as EAN-13 (X XXX XXXX XXXX X)
  if (cleaned.length === 13) {
    return `${cleaned.slice(0, 1)} ${cleaned.slice(1, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8, 12)} ${cleaned.slice(12)}`;
  }
  
  return cleaned;
}

export function formatCustomerCode(id: string): string {
  // Generate customer code like CUST-000001
  const numericId = id.replace(/\D/g, '');
  const paddedId = numericId.padStart(6, '0');
  return `CUST-${paddedId}`;
}

export function formatInvoiceNumber(id: string, prefix: string = 'INV'): string {
  // Generate invoice number like INV-2024-000001
  const year = new Date().getFullYear();
  const numericId = id.replace(/\D/g, '');
  const paddedId = numericId.padStart(6, '0');
  return `${prefix}-${year}-${paddedId}`;
}

export function formatReceiptNumber(id: string): string {
  // Generate receipt number like RCP-240101-001
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const numericId = id.replace(/\D/g, '');
  const paddedId = numericId.slice(-3).padStart(3, '0');
  
  return `RCP-${year}${month}${day}-${paddedId}`;
}

// URL and slug formatting
export function formatProductSlug(name: string, sku?: string): string {
  const nameSlug = slugify(name);
  const skuPart = sku ? `-${sku.toLowerCase()}` : '';
  return `${nameSlug}${skuPart}`;
}

// Address formatting
export function formatAddress(parts: {
  street?: string;
  city?: string;
  district?: string;
  province?: string;
  country?: string;
}): string {
  const addressParts = [
    parts.street,
    parts.city,
    parts.district,
    parts.province,
    parts.country || 'Rwanda'
  ].filter(Boolean);
  
  return addressParts.join(', ');
}

// Validation helpers that return formatted messages
export function formatValidationError(field: string, message: string): string {
  return `${capitalizeWords(field)}: ${message}`;
}

export function formatValidationErrors(errors: Record<string, string[]>): string[] {
  return Object.entries(errors).flatMap(([field, messages]) =>
    messages.map(message => formatValidationError(field, message))
  );
}

// Search and filter helpers
export function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

export function highlightSearchTerm(text: string, term: string): string {
  if (!term) return text;
  
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Color and display utilities
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

export function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

// Utility to format arrays for display
export function formatList(
  items: string[], 
  conjunction: string = 'and',
  maxItems: number = 3
): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  
  const visibleItems = items.slice(0, maxItems);
  const remaining = items.length - maxItems;
  
  if (remaining > 0) {
    return `${visibleItems.join(', ')} ${conjunction} ${remaining} other${remaining === 1 ? '' : 's'}`;
  }
  
  const allButLast = visibleItems.slice(0, -1);
  const last = visibleItems[visibleItems.length - 1];
  
  return `${allButLast.join(', ')}, ${conjunction} ${last}`;
}
