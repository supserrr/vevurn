// Date and time utilities for Rwanda timezone (CAT - Central Africa Time)
const RWANDA_TIMEZONE = 'Africa/Kigali';
const DEFAULT_LOCALE = 'en-RW';

// Date creation and manipulation
export function now(): Date {
  return new Date();
}

export function today(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export function tomorrow(): Date {
  const date = today();
  date.setDate(date.getDate() + 1);
  return date;
}

export function yesterday(): Date {
  const date = today();
  date.setDate(date.getDate() - 1);
  return date;
}

export function startOfWeek(date: Date = new Date()): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfWeek(date: Date = new Date()): Date {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfMonth(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfMonth(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfYear(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setMonth(0, 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfYear(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setMonth(11, 31);
  result.setHours(23, 59, 59, 999);
  return result;
}

// Date arithmetic
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function subtractWeeks(date: Date, weeks: number): Date {
  return addWeeks(date, -weeks);
}

export function subtractMonths(date: Date, months: number): Date {
  return addMonths(date, -months);
}

export function subtractYears(date: Date, years: number): Date {
  return addYears(date, -years);
}

// Date comparison
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isSameWeek(date1: Date, date2: Date): boolean {
  const week1 = startOfWeek(date1);
  const week2 = startOfWeek(date2);
  return isSameDay(week1, week2);
}

export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

export function isSameYear(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear();
}

export function isBefore(date1: Date, date2: Date): boolean {
  return date1.getTime() < date2.getTime();
}

export function isAfter(date1: Date, date2: Date): boolean {
  return date1.getTime() > date2.getTime();
}

export function isBetween(date: Date, start: Date, end: Date): boolean {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isTomorrow(date: Date): boolean {
  return isSameDay(date, tomorrow());
}

export function isYesterday(date: Date): boolean {
  return isSameDay(date, yesterday());
}

export function isPast(date: Date): boolean {
  return isBefore(date, new Date());
}

export function isFuture(date: Date): boolean {
  return isAfter(date, new Date());
}

// Date difference calculations
export function differenceInDays(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date1.getTime() - date2.getTime());
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
}

export function differenceInWeeks(date1: Date, date2: Date): number {
  return Math.ceil(differenceInDays(date1, date2) / 7);
}

export function differenceInMonths(date1: Date, date2: Date): number {
  const yearDiff = date1.getFullYear() - date2.getFullYear();
  const monthDiff = date1.getMonth() - date2.getMonth();
  return yearDiff * 12 + monthDiff;
}

export function differenceInYears(date1: Date, date2: Date): number {
  return date1.getFullYear() - date2.getFullYear();
}

export function differenceInHours(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date1.getTime() - date2.getTime());
  return Math.ceil(timeDiff / (1000 * 60 * 60));
}

export function differenceInMinutes(date1: Date, date2: Date): number {
  const timeDiff = Math.abs(date1.getTime() - date2.getTime());
  return Math.ceil(timeDiff / (1000 * 60));
}

// Date formatting
export function formatDate(
  date: Date,
  format: 'short' | 'medium' | 'long' | 'full' = 'medium',
  locale: string = DEFAULT_LOCALE
): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: RWANDA_TIMEZONE,
  };

  switch (format) {
    case 'short':
      options.day = '2-digit';
      options.month = '2-digit';
      options.year = 'numeric';
      break;
    case 'medium':
      options.day = 'numeric';
      options.month = 'short';
      options.year = 'numeric';
      break;
    case 'long':
      options.day = 'numeric';
      options.month = 'long';
      options.year = 'numeric';
      break;
    case 'full':
      options.weekday = 'long';
      options.day = 'numeric';
      options.month = 'long';
      options.year = 'numeric';
      break;
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatTime(
  date: Date,
  format: '12' | '24' = '24',
  locale: string = DEFAULT_LOCALE
): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: RWANDA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: format === '12',
  };

  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatDateTime(
  date: Date,
  dateFormat: 'short' | 'medium' | 'long' = 'medium',
  timeFormat: '12' | '24' = '24',
  locale: string = DEFAULT_LOCALE
): string {
  const formattedDate = formatDate(date, dateFormat, locale);
  const formattedTime = formatTime(date, timeFormat, locale);
  return `${formattedDate} ${formattedTime}`;
}

// Relative time formatting
export function formatRelativeTime(date: Date, locale: string = DEFAULT_LOCALE): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (Math.abs(diffInSeconds) < 60) {
    return 'just now';
  }

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const intervals = [
    { unit: 'year' as const, seconds: 31536000 },
    { unit: 'month' as const, seconds: 2628000 },
    { unit: 'week' as const, seconds: 604800 },
    { unit: 'day' as const, seconds: 86400 },
    { unit: 'hour' as const, seconds: 3600 },
    { unit: 'minute' as const, seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
    if (count > 0) {
      return rtf.format(diffInSeconds < 0 ? count : -count, interval.unit);
    }
  }

  return rtf.format(-diffInSeconds, 'second');
}

// Business hours and working days
export function isBusinessHours(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 8 && hour < 18; // 8 AM to 6 PM
}

export function isWeekend(date: Date = new Date()): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function isWorkingDay(date: Date = new Date()): boolean {
  return !isWeekend(date);
}

export function getBusinessDaysInMonth(date: Date = new Date()): number {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  let businessDays = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (isWorkingDay(d)) {
      businessDays++;
    }
  }

  return businessDays;
}

// Date range utilities
export function getDateRange(
  period: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear',
  referenceDate: Date = new Date()
): { start: Date; end: Date } {
  switch (period) {
    case 'today':
      return { start: today(), end: today() };
    case 'yesterday':
      return { start: yesterday(), end: yesterday() };
    case 'thisWeek':
      return { start: startOfWeek(referenceDate), end: endOfWeek(referenceDate) };
    case 'lastWeek':
      const lastWeekStart = startOfWeek(subtractWeeks(referenceDate, 1));
      return { start: lastWeekStart, end: endOfWeek(lastWeekStart) };
    case 'thisMonth':
      return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
    case 'lastMonth':
      const lastMonth = subtractMonths(referenceDate, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    case 'thisYear':
      return { start: startOfYear(referenceDate), end: endOfYear(referenceDate) };
    case 'lastYear':
      const lastYear = subtractYears(referenceDate, 1);
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
    default:
      return { start: today(), end: today() };
  }
}

// Date validation
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

export function parseDate(dateString: string): Date | null {
  const date = new Date(dateString);
  return isValidDate(date) ? date : null;
}

// Age calculation
export function calculateAge(birthDate: Date, referenceDate: Date = new Date()): number {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Timezone utilities
export function toRwandaTime(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: RWANDA_TIMEZONE }));
}

export function fromRwandaTime(date: Date): Date {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset);
}

// Date array utilities
export function getDatesInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

export function getWorkingDatesInRange(start: Date, end: Date): Date[] {
  return getDatesInRange(start, end).filter(date => isWorkingDay(date));
}
