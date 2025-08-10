import { format, formatDistance, formatRelative, parseISO } from 'date-fns';
import { 
  enUS, enGB, fr, de, es, ptBR, zhCN, ja, arSA 
} from 'date-fns/locale';
import * as numeral from 'numeral';
import { logger } from '../utils/logger';

// Define supported locales with fallbacks for East African locales
const SUPPORTED_LOCALES = {
  'en-US': { dateLocale: enUS, name: 'English (US)', rtl: false },
  'en-GB': { dateLocale: enGB, name: 'English (UK)', rtl: false },
  'en-RW': { dateLocale: enGB, name: 'English (Rwanda)', rtl: false }, // Fallback to enGB
  'fr-FR': { dateLocale: fr, name: 'Français', rtl: false },
  'fr-RW': { dateLocale: fr, name: 'Français (Rwanda)', rtl: false }, // Fallback to fr
  'de-DE': { dateLocale: de, name: 'Deutsch', rtl: false },
  'es-ES': { dateLocale: es, name: 'Español', rtl: false },
  'pt-BR': { dateLocale: ptBR, name: 'Português', rtl: false },
  'zh-CN': { dateLocale: zhCN, name: '中文', rtl: false },
  'ja-JP': { dateLocale: ja, name: '日本語', rtl: false },
  'ar-SA': { dateLocale: arSA, name: 'العربية', rtl: true },
  'sw-KE': { dateLocale: enUS, name: 'Kiswahili', rtl: false } // Fallback to enUS
};

// Currency configurations
const CURRENCY_CONFIG = {
  'RWF': { symbol: 'FRw', decimals: 0, format: '#,##0', locale: 'rw-RW' },
  'USD': { symbol: '$', decimals: 2, format: '#,##0.00', locale: 'en-US' },
  'EUR': { symbol: '€', decimals: 2, format: '#,##0.00', locale: 'de-DE' },
  'GBP': { symbol: '£', decimals: 2, format: '#,##0.00', locale: 'en-GB' },
  'CNY': { symbol: '¥', decimals: 2, format: '#,##0.00', locale: 'zh-CN' },
  'JPY': { symbol: '¥', decimals: 0, format: '#,##0', locale: 'ja-JP' },
  'KES': { symbol: 'KSh', decimals: 2, format: '#,##0.00', locale: 'sw-KE' },
  'UGX': { symbol: 'USh', decimals: 0, format: '#,##0', locale: 'en-UG' },
  'TZS': { symbol: 'TSh', decimals: 0, format: '#,##0', locale: 'sw-TZ' }
};

// Time zone mappings
const TIMEZONE_MAPPINGS = {
  'Africa/Kigali': 'Rwanda',
  'Africa/Nairobi': 'Kenya',
  'Africa/Kampala': 'Uganda',
  'Africa/Dar_es_Salaam': 'Tanzania',
  'America/New_York': 'US East',
  'America/Los_Angeles': 'US West',
  'Europe/London': 'UK',
  'Europe/Paris': 'France',
  'Asia/Tokyo': 'Japan',
  'Asia/Shanghai': 'China'
};

interface LocalizationConfig {
  locale: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  numberFormat: string;
  firstDayOfWeek: 0 | 1 | 6; // 0 = Sunday, 1 = Monday, 6 = Saturday
  workingDays: number[]; // Array of day numbers (0-6)
}

interface LocalizedDate {
  formatted: string;
  relative: string;
  iso: string;
  timestamp: number;
  parts: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    dayOfWeek: number;
    weekOfYear: number;
  };
}

interface LocalizedNumber {
  formatted: string;
  raw: number;
  currency?: string;
  parts?: {
    integer: string;
    decimal?: string;
    currency?: string;
  };
}

export class LocalizationService {
  private static instance: LocalizationService;
  private userConfigs: Map<string, LocalizationConfig> = new Map();
  private defaultConfig: LocalizationConfig = {
    locale: 'en-RW',
    timezone: 'Africa/Kigali',
    currency: 'RWF',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: '24h',
    numberFormat: '#,##0.00',
    firstDayOfWeek: 1,
    workingDays: [1, 2, 3, 4, 5] // Monday to Friday
  };

  static getInstance(): LocalizationService {
    if (!this.instance) {
      this.instance = new LocalizationService();
    }
    return this.instance;
  }

  /**
   * Set user-specific localization config
   */
  setUserConfig(userId: string, config: Partial<LocalizationConfig>): void {
    const currentConfig = this.userConfigs.get(userId) || { ...this.defaultConfig };
    this.userConfigs.set(userId, { ...currentConfig, ...config });
  }

  /**
   * Get user's localization config
   */
  getUserConfig(userId: string): LocalizationConfig {
    return this.userConfigs.get(userId) || { ...this.defaultConfig };
  }

  /**
   * Format date according to user's locale and preferences
   */
  formatDate(
    date: Date | string,
    userId: string,
    formatType: 'short' | 'medium' | 'long' | 'full' | 'custom' = 'medium',
    customFormat?: string
  ): LocalizedDate {
    const config = this.getUserConfig(userId);
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const localeConfig = SUPPORTED_LOCALES[config.locale as keyof typeof SUPPORTED_LOCALES];

    // Determine format string
    let formatString: string;
    switch (formatType) {
      case 'short':
        formatString = config.dateFormat;
        break;
      case 'medium':
        formatString = `${config.dateFormat} ${config.timeFormat === '12h' ? 'h:mm a' : 'HH:mm'}`;
        break;
      case 'long':
        formatString = `EEEE, MMMM d, yyyy ${config.timeFormat === '12h' ? 'h:mm:ss a' : 'HH:mm:ss'}`;
        break;
      case 'full':
        formatString = `EEEE, MMMM d, yyyy ${config.timeFormat === '12h' ? 'h:mm:ss a' : 'HH:mm:ss'} zzzz`;
        break;
      case 'custom':
        formatString = customFormat || config.dateFormat;
        break;
      default:
        formatString = config.dateFormat;
    }

    const formatted = format(dateObj, formatString, { 
      locale: localeConfig.dateLocale 
    });

    const relative = formatRelative(dateObj, new Date(), { 
      locale: localeConfig.dateLocale 
    });

    return {
      formatted,
      relative,
      iso: dateObj.toISOString(),
      timestamp: dateObj.getTime(),
      parts: {
        year: dateObj.getFullYear(),
        month: dateObj.getMonth() + 1,
        day: dateObj.getDate(),
        hour: dateObj.getHours(),
        minute: dateObj.getMinutes(),
        second: dateObj.getSeconds(),
        dayOfWeek: dateObj.getDay(),
        weekOfYear: this.getWeekOfYear(dateObj)
      }
    };
  }

  /**
   * Format time duration
   */
  formatDuration(
    startDate: Date,
    endDate: Date,
    userId: string
  ): string {
    const config = this.getUserConfig(userId);
    const localeConfig = SUPPORTED_LOCALES[config.locale as keyof typeof SUPPORTED_LOCALES];

    return formatDistance(startDate, endDate, {
      locale: localeConfig.dateLocale,
      addSuffix: true
    });
  }

  /**
   * Format number according to locale
   */
  formatNumber(
    value: number,
    userId: string,
    options?: {
      style?: 'decimal' | 'currency' | 'percent';
      currency?: string;
      minimumFractionDigits?: number;
      maximumFractionDigits?: number;
    }
  ): LocalizedNumber {
    const config = this.getUserConfig(userId);
    const currency = options?.currency || config.currency;
    const style = options?.style || 'decimal';

    let formatted: string;
    let parts: any = {};

    if (style === 'currency' && currency) {
      const currencyConfig = CURRENCY_CONFIG[currency as keyof typeof CURRENCY_CONFIG];
      if (currencyConfig) {
        // Use numeral for consistent formatting
        const formatString = currencyConfig.format;
        formatted = numeral(value).format(formatString);
        
        // Add currency symbol
        if (currency === 'EUR') {
          formatted = `${formatted} ${currencyConfig.symbol}`;
        } else {
          formatted = `${currencyConfig.symbol} ${formatted}`;
        }

        parts = {
          integer: Math.floor(value).toString(),
          decimal: currencyConfig.decimals > 0 ? 
            (value % 1).toFixed(currencyConfig.decimals).substring(2) : undefined,
          currency: currencyConfig.symbol
        };
      } else {
        // Fallback to basic formatting
        formatted = new Intl.NumberFormat(config.locale, {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: options?.minimumFractionDigits,
          maximumFractionDigits: options?.maximumFractionDigits
        }).format(value);
      }
    } else if (style === 'percent') {
      formatted = new Intl.NumberFormat(config.locale, {
        style: 'percent',
        minimumFractionDigits: options?.minimumFractionDigits || 0,
        maximumFractionDigits: options?.maximumFractionDigits || 2
      }).format(value);
    } else {
      // Decimal formatting
      formatted = new Intl.NumberFormat(config.locale, {
        minimumFractionDigits: options?.minimumFractionDigits,
        maximumFractionDigits: options?.maximumFractionDigits
      }).format(value);

      parts = {
        integer: Math.floor(value).toString(),
        decimal: options?.minimumFractionDigits ? 
          (value % 1).toFixed(options.minimumFractionDigits).substring(2) : undefined
      };
    }

    return {
      formatted,
      raw: value,
      currency: style === 'currency' ? currency : undefined,
      parts: Object.keys(parts).length > 0 ? parts : undefined
    };
  }

  /**
   * Parse localized number string back to number
   */
  parseNumber(
    value: string,
    userId: string,
    style: 'decimal' | 'currency' | 'percent' = 'decimal'
  ): number {
    const config = this.getUserConfig(userId);
    
    // Remove currency symbols and non-numeric characters
    let cleanValue = value.replace(/[^\d.,\-]/g, '');
    
    // Handle different decimal separators based on locale
    if (config.locale.startsWith('de') || config.locale.startsWith('fr')) {
      // German/French use comma as decimal separator
      cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else {
      // English uses period as decimal separator
      cleanValue = cleanValue.replace(/,/g, '');
    }

    const parsed = parseFloat(cleanValue);
    
    if (style === 'percent') {
      return parsed / 100;
    }
    
    return parsed;
  }

  /**
   * Get localized day names
   */
  getDayNames(userId: string, formatType: 'long' | 'short' = 'long'): string[] {
    const config = this.getUserConfig(userId);
    const localeConfig = SUPPORTED_LOCALES[config.locale as keyof typeof SUPPORTED_LOCALES];
    
    const days: string[] = [];
    const baseDate = new Date(2024, 0, 1); // Start with a Monday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      
      const formatted = formatType === 'long' ?
        format(date, 'EEEE', { locale: localeConfig.dateLocale }) :
        format(date, 'EEE', { locale: localeConfig.dateLocale });
      
      days.push(formatted);
    }
    
    // Reorder based on firstDayOfWeek
    const reordered: string[] = [];
    for (let i = config.firstDayOfWeek; i < 7; i++) {
      reordered.push(days[i]);
    }
    for (let i = 0; i < config.firstDayOfWeek; i++) {
      reordered.push(days[i]);
    }
    
    return reordered;
  }

  /**
   * Get localized month names
   */
  getMonthNames(userId: string, formatType: 'long' | 'short' = 'long'): string[] {
    const config = this.getUserConfig(userId);
    const localeConfig = SUPPORTED_LOCALES[config.locale as keyof typeof SUPPORTED_LOCALES];
    
    const months: string[] = [];
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(2024, i, 1);
      const formatted = formatType === 'long' ?
        format(date, 'MMMM', { locale: localeConfig.dateLocale }) :
        format(date, 'MMM', { locale: localeConfig.dateLocale });
      
      months.push(formatted);
    }
    
    return months;
  }

  /**
   * Convert between time zones
   */
  convertTimeZone(
    date: Date,
    fromTimeZone: string,
    toTimeZone: string
  ): Date {
    try {
      // Create a new date with the same UTC time but in the target timezone
      const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
      
      // Get offset for target timezone
      const targetDate = new Date(date.toLocaleString('en-US', { timeZone: toTimeZone }));
      const targetOffset = targetDate.getTimezoneOffset() * 60000;
      
      return new Date(utcTime - targetOffset);
    } catch (error) {
      logger.warn(`Failed to convert timezone from ${fromTimeZone} to ${toTimeZone}:`, error);
      return date;
    }
  }

  /**
   * Get business hours for a specific locale
   */
  getBusinessHours(userId: string): {
    start: string;
    end: string;
    workingDays: number[];
    timezone: string;
  } {
    const config = this.getUserConfig(userId);
    
    // Default business hours based on locale
    const businessHours: { [key: string]: { start: string; end: string } } = {
      'en-US': { start: '09:00', end: '17:00' },
      'en-GB': { start: '09:00', end: '17:30' },
      'en-RW': { start: '08:00', end: '17:00' },
      'fr-RW': { start: '08:00', end: '17:00' },
      'de-DE': { start: '08:00', end: '16:30' },
      'ja-JP': { start: '09:00', end: '18:00' },
      'ar-SA': { start: '08:00', end: '16:00' }
    };
    
    const hours = businessHours[config.locale] || businessHours['en-US'];
    
    return {
      ...hours,
      workingDays: config.workingDays,
      timezone: config.timezone
    };
  }

  /**
   * Format address according to locale
   */
  formatAddress(
    address: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    },
    userId: string
  ): string {
    const config = this.getUserConfig(userId);
    
    // Different address formats for different locales
    if (config.locale.startsWith('en-US')) {
      return [
        address.street,
        address.city,
        address.state ? `${address.state} ${address.postalCode}` : address.postalCode,
        address.country
      ].filter(Boolean).join(', ');
    } else if (config.locale.startsWith('ja-JP')) {
      // Japanese format: postal code, prefecture, city, street
      return [
        address.postalCode,
        address.state,
        address.city,
        address.street
      ].filter(Boolean).join(' ');
    } else if (config.locale.endsWith('RW')) {
      // Rwanda format
      return [
        address.street,
        address.city,
        address.state,
        'Rwanda'
      ].filter(Boolean).join(', ');
    } else {
      // Default format
      return [
        address.street,
        address.postalCode,
        address.city,
        address.state,
        address.country
      ].filter(Boolean).join(', ');
    }
  }

  /**
   * Get locale-specific validation rules
   */
  getValidationRules(userId: string): {
    phone: RegExp;
    postalCode: RegExp;
    taxId: RegExp;
  } {
    const config = this.getUserConfig(userId);
    
    const rules: { [key: string]: any } = {
      'en-US': {
        phone: /^\+?1?[-.\s]?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/,
        postalCode: /^\d{5}(-\d{4})?$/,
        taxId: /^\d{2}-\d{7}$/ // EIN format
      },
      'en-GB': {
        phone: /^\+?44?[-.\s]?\(?[0-9]{4,5}\)?[-.\s]?[0-9]{6,7}$/,
        postalCode: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
        taxId: /^[A-Z]{2}\d{6}[A-Z]?$/ // NI number
      },
      'en-RW': {
        phone: /^\+?250?[-.\s]?7[2-9]\d{7}$/,
        postalCode: /^\d{4,6}$/,
        taxId: /^\d{9}$/ // TIN format
      },
      'fr-RW': {
        phone: /^\+?250?[-.\s]?7[2-9]\d{7}$/,
        postalCode: /^\d{4,6}$/,
        taxId: /^\d{9}$/
      }
    };
    
    return rules[config.locale] || rules['en-US'];
  }

  /**
   * Get RTL (Right-to-Left) support for locale
   */
  isRTL(userId: string): boolean {
    const config = this.getUserConfig(userId);
    const localeConfig = SUPPORTED_LOCALES[config.locale as keyof typeof SUPPORTED_LOCALES];
    return localeConfig?.rtl || false;
  }

  /**
   * Get text direction for locale
   */
  getTextDirection(userId: string): 'ltr' | 'rtl' {
    return this.isRTL(userId) ? 'rtl' : 'ltr';
  }

  /**
   * Format file size according to locale
   */
  formatFileSize(bytes: number, userId: string): string {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    if (bytes === 0) {
      return this.formatNumber(0, userId, { minimumFractionDigits: 0 }).formatted + ' B';
    }
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const value = bytes / Math.pow(1024, i);
    
    const formatted = this.formatNumber(value, userId, {
      minimumFractionDigits: i === 0 ? 0 : 1,
      maximumFractionDigits: 2
    });
    
    return `${formatted.formatted} ${sizes[i]}`;
  }

  /**
   * Get supported locales list
   */
  getSupportedLocales(): Array<{code: string, name: string, rtl: boolean}> {
    return Object.entries(SUPPORTED_LOCALES).map(([code, config]) => ({
      code,
      name: config.name,
      rtl: config.rtl
    }));
  }

  /**
   * Get supported currencies list
   */
  getSupportedCurrencies(): Array<{code: string, symbol: string, decimals: number}> {
    return Object.entries(CURRENCY_CONFIG).map(([code, config]) => ({
      code,
      symbol: config.symbol,
      decimals: config.decimals
    }));
  }

  /**
   * Get supported timezones list
   */
  getSupportedTimezones(): Array<{code: string, name: string}> {
    return Object.entries(TIMEZONE_MAPPINGS).map(([code, name]) => ({
      code,
      name
    }));
  }

  /**
   * Get week of year
   */
  private getWeekOfYear(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Export all localization data for a user
   */
  exportLocalizationData(userId: string): {
    config: LocalizationConfig;
    supportedLocales: string[];
    supportedCurrencies: string[];
    supportedTimezones: string[];
  } {
    return {
      config: this.getUserConfig(userId),
      supportedLocales: Object.keys(SUPPORTED_LOCALES),
      supportedCurrencies: Object.keys(CURRENCY_CONFIG),
      supportedTimezones: Object.keys(TIMEZONE_MAPPINGS)
    };
  }

  /**
   * Format phone number according to locale
   */
  formatPhoneNumber(phone: string, userId: string): string {
    const config = this.getUserConfig(userId);
    
    // Clean phone number
    const cleaned = phone.replace(/\D/g, '');
    
    if (config.locale === 'en-RW' || config.locale === 'fr-RW') {
      // Rwanda format: +250 XXX XXX XXX
      if (cleaned.startsWith('250')) {
        return `+250 ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`;
      } else if (cleaned.startsWith('07')) {
        return `+250 ${cleaned.substring(1, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
      }
    } else if (config.locale === 'en-US') {
      // US format: (XXX) XXX-XXXX
      if (cleaned.length === 10) {
        return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
      }
    }
    
    return phone; // Return original if no formatting rule matches
  }

  /**
   * Get localized error messages
   */
  getErrorMessages(userId: string): { [key: string]: string } {
    const config = this.getUserConfig(userId);
    
    const messages: { [locale: string]: { [key: string]: string } } = {
      'en-US': {
        required: 'This field is required',
        invalid: 'Invalid value',
        tooShort: 'Value is too short',
        tooLong: 'Value is too long',
        invalidEmail: 'Invalid email address',
        invalidPhone: 'Invalid phone number',
        invalidDate: 'Invalid date format',
        insufficientFunds: 'Insufficient funds',
        accessDenied: 'Access denied'
      },
      'fr-FR': {
        required: 'Ce champ est obligatoire',
        invalid: 'Valeur invalide',
        tooShort: 'Valeur trop courte',
        tooLong: 'Valeur trop longue',
        invalidEmail: 'Adresse e-mail invalide',
        invalidPhone: 'Numéro de téléphone invalide',
        invalidDate: 'Format de date invalide',
        insufficientFunds: 'Fonds insuffisants',
        accessDenied: 'Accès refusé'
      },
      'sw-KE': {
        required: 'Sehemu hii ni lazima',
        invalid: 'Thamani batili',
        tooShort: 'Thamani ni fupi sana',
        tooLong: 'Thamani ni ndefu sana',
        invalidEmail: 'Anwani ya barua pepe si sahihi',
        invalidPhone: 'Nambari ya simu si sahihi',
        invalidDate: 'Muundo wa tarehe si sahihi',
        insufficientFunds: 'Fedha hazitoshi',
        accessDenied: 'Ufikiaji umekataliwa'
      }
    };
    
    return messages[config.locale] || messages['en-US'];
  }
}

export default LocalizationService;
