import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { logger } from '../../utils/secureLogger';

/**
 * Domain service for security-related business logic
 * Following DDD patterns for security operations
 */
export class SecurityService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly PASSWORD_MIN_LENGTH = 8;
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Hash password with secure salt
   */
  static async hashPassword(password: string): Promise<string> {
    if (!password || password.length < this.PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long`);
    }

    try {
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      logger.error('Password hashing failed', { error });
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }

    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Password verification failed', { error });
      return false;
    }
  }

  /**
   * Generate secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure API key
   */
  static generateApiKey(): string {
    const prefix = 'sk_';
    const randomPart = crypto.randomBytes(24).toString('base64url');
    return prefix + randomPart;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < this.PASSWORD_MIN_LENGTH) {
      errors.push(`Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long`);
    } else {
      score += 1;
    }

    // Uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    // Lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    // Number
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    // Special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Common passwords check
    const commonPasswords = [
      'password', '123456', 'password123', 'admin', 'qwerty',
      'letmein', 'welcome', 'monkey', '1234567890'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common');
      score = Math.max(0, score - 2);
    }

    return {
      isValid: errors.length === 0 && score >= 4,
      errors,
      score
    };
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Check if IP is in allowed range (for IP whitelisting)
   */
  static isIpAllowed(ip: string, allowedRanges: string[] = []): boolean {
    if (allowedRanges.length === 0) {
      return true; // No restrictions
    }

    // Simple IP validation for now
    // In production, use a proper IP range library
    return allowedRanges.some(range => {
      if (range === ip) return true;
      if (range.includes('/')) {
        // CIDR notation - simplified check
        const [network] = range.split('/');
        return ip.startsWith(network.substring(0, network.lastIndexOf('.')));
      }
      return false;
    });
  }

  /**
   * Generate CSRF token
   */
  static generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate CSRF token
   */
  static validateCsrfToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(
        Buffer.from(token, 'hex'),
        Buffer.from(sessionToken, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Rate limiting check
   */
  static checkRateLimit(
    identifier: string,
    maxAttempts: number,
    windowMs: number,
    attempts: Map<string, { count: number; resetTime: number }>
  ): { allowed: boolean; resetTime?: number } {
    const now = Date.now();
    const record = attempts.get(identifier);

    if (!record || now > record.resetTime) {
      // First attempt or window expired
      attempts.set(identifier, { count: 1, resetTime: now + windowMs });
      return { allowed: true };
    }

    if (record.count >= maxAttempts) {
      return { allowed: false, resetTime: record.resetTime };
    }

    // Increment counter
    record.count++;
    attempts.set(identifier, record);
    return { allowed: true };
  }

  /**
   * Secure string comparison to prevent timing attacks
   */
  static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
      return false;
    }
  }

  /**
   * Generate secure session ID
   */
  static generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Mask sensitive data for logging
   */
  static maskSensitiveData(data: string, visibleChars: number = 3): string {
    if (!data || data.length <= visibleChars) {
      return '***';
    }

    const visible = data.substring(0, visibleChars);
    const masked = '*'.repeat(Math.min(data.length - visibleChars, 10));
    return visible + masked;
  }
} 