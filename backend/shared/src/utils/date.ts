// Date and time utility functions

export function formatDate(date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string {
  const d = new Date(date)
  
  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-GB') // DD/MM/YYYY
    case 'long':
      return d.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    case 'iso':
      return d.toISOString().split('T')[0] // YYYY-MM-DD
    default:
      return d.toLocaleDateString()
  }
}

export function formatTime(date: Date | string, includeSeconds: boolean = false): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-GB', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' })
  })
}

export function formatDateTime(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date)
  
  if (format === 'long') {
    return d.toLocaleString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
  
  return `${formatDate(d)} ${formatTime(d)}`
}

export function getRelativeTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return formatDate(d)
}

export function isToday(date: Date | string): boolean {
  const d = new Date(date)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

export function isYesterday(date: Date | string): boolean {
  const d = new Date(date)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return d.toDateString() === yesterday.toDateString()
}

export function getDateRange(period: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year'): {
  startDate: Date
  endDate: Date
} {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (period) {
    case 'today':
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      }
    
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return {
        startDate: yesterday,
        endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      }
    
    case 'week':
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - today.getDay())
      return {
        startDate: weekStart,
        endDate: now
      }
    
    case 'month':
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      return {
        startDate: monthStart,
        endDate: now
      }
    
    case 'quarter':
      const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1)
      return {
        startDate: quarterStart,
        endDate: now
      }
    
    case 'year':
      const yearStart = new Date(today.getFullYear(), 0, 1)
      return {
        startDate: yearStart,
        endDate: now
      }
    
    default:
      return { startDate: today, endDate: now }
  }
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function diffInDays(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
