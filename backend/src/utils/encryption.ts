import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted data format');
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed');
  }
}

/**
 * Hash password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash API key or sensitive identifier
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}
