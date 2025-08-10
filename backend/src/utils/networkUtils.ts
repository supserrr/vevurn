import { Request } from 'express';

/**
 * Get client IP address from request
 */
export function getClientIP(req: Request): string {
  // Check for IP from various headers (for proxy/load balancer scenarios)
  const forwarded = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const clientIP = req.headers['x-client-ip'];
  
  if (forwarded && typeof forwarded === 'string') {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP && typeof realIP === 'string') {
    return realIP;
  }
  
  if (clientIP && typeof clientIP === 'string') {
    return clientIP;
  }
  
  // Fall back to connection remote address
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         (req.connection as any)?.socket?.remoteAddress || 
         req.ip || 
         'unknown';
}

/**
 * Validate IP address format
 */
export function isValidIP(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Anonymize IP address for logging/storage (GDPR compliance)
 */
export function anonymizeIP(ip: string): string {
  if (ip === 'unknown') return ip;
  
  // For IPv4, mask the last octet
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }
  
  // For IPv6, mask the last 64 bits
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      return `${parts.slice(0, 4).join(':')}::`;
    }
  }
  
  return 'anonymized';
}

/**
 * Get network information from request
 */
export function getNetworkInfo(req: Request): {
  ip: string;
  userAgent: string;
  origin?: string;
  referer?: string;
  anonymizedIP: string;
} {
  const ip = getClientIP(req);
  
  return {
    ip,
    userAgent: req.get('User-Agent') || '',
    origin: req.get('Origin'),
    referer: req.get('Referer'),
    anonymizedIP: anonymizeIP(ip)
  };
}
