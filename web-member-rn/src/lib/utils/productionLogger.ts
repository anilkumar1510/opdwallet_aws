/**
 * Production-Safe Logger
 *
 * Provides logging utilities that automatically redact PII/PHI in production.
 * In development mode, logs are passed through unchanged.
 *
 * HIPAA Compliance: Prevents PHI from being exposed in production logs.
 */

// Patterns for detecting sensitive data
const SENSITIVE_PATTERNS = {
  // Email addresses
  email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
  // Phone numbers (various formats)
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  // Member IDs (common patterns)
  memberId: /\b(MEM|UHID|ID)[A-Z0-9-]{4,20}\b/gi,
  // Names in common log formats
  firstName: /"firstName"\s*:\s*"([^"]+)"/gi,
  lastName: /"lastName"\s*:\s*"([^"]+)"/gi,
  fullName: /"fullName"\s*:\s*"([^"]+)"/gi,
  name: /"name"\s*:\s*"([^"]+)"/gi,
  // Date of birth
  dob: /"(dateOfBirth|dob)"\s*:\s*"([^"]+)"/gi,
  // JWT tokens
  token: /(eyJ[A-Za-z0-9-_=]+\.eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]*)/g,
  // Object IDs (MongoDB)
  objectId: /\b[a-f\d]{24}\b/gi,
  // Credit card numbers
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // SSN (US)
  ssn: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  // Aadhaar (India)
  aadhaar: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
};

// Redaction masks
const REDACTION_MASKS: Record<string, string> = {
  email: '[EMAIL_REDACTED]',
  phone: '[PHONE_REDACTED]',
  memberId: '[MEMBER_ID_REDACTED]',
  firstName: '"firstName": "[NAME_REDACTED]"',
  lastName: '"lastName": "[NAME_REDACTED]"',
  fullName: '"fullName": "[NAME_REDACTED]"',
  name: '"name": "[NAME_REDACTED]"',
  dob: '"$1": "[DOB_REDACTED]"',
  token: '[TOKEN_REDACTED]',
  objectId: '[ID_REDACTED]',
  creditCard: '[CARD_REDACTED]',
  ssn: '[SSN_REDACTED]',
  aadhaar: '[AADHAAR_REDACTED]',
};

/**
 * Redacts sensitive data from a string
 */
function redactString(input: string): string {
  let result = input;

  for (const [key, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    const mask = REDACTION_MASKS[key];
    result = result.replace(pattern, mask);
  }

  return result;
}

/**
 * Deep redacts sensitive data from an object
 */
function redactObject(obj: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]';

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return redactString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const redacted: Record<string, unknown> = {};
    const sensitiveKeys = [
      'password', 'token', 'accessToken', 'refreshToken', 'secret',
      'email', 'phone', 'mobile', 'ssn', 'aadhaar', 'pan',
      'firstName', 'lastName', 'fullName', 'name',
      'dateOfBirth', 'dob', 'birthDate',
      'address', 'street', 'city', 'zipCode', 'pincode',
      'memberId', 'uhid', 'patientId',
      'creditCard', 'cardNumber', 'cvv', 'expiry',
      'diagnosis', 'prescription', 'treatment', 'medication',
    ];

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactObject(value, depth + 1);
      }
    }

    return redacted;
  }

  return obj;
}

/**
 * Processes log arguments for production safety
 */
function processArgs(args: unknown[]): unknown[] {
  if (__DEV__) {
    // In development, pass through unchanged
    return args;
  }

  return args.map(arg => {
    if (typeof arg === 'string') {
      return redactString(arg);
    }
    if (typeof arg === 'object') {
      return redactObject(arg);
    }
    return arg;
  });
}

/**
 * Production-safe logger interface
 */
export const logger = {
  /**
   * Debug level logging - only in development
   */
  debug: (...args: unknown[]): void => {
    if (__DEV__) {
      console.debug(...args);
    }
  },

  /**
   * Info level logging - redacted in production
   */
  info: (...args: unknown[]): void => {
    console.log(...processArgs(args));
  },

  /**
   * Warning level logging - redacted in production
   */
  warn: (...args: unknown[]): void => {
    console.warn(...processArgs(args));
  },

  /**
   * Error level logging - redacted in production
   */
  error: (...args: unknown[]): void => {
    console.error(...processArgs(args));
  },

  /**
   * Logs with a specific context tag
   */
  withContext: (context: string) => ({
    debug: (...args: unknown[]): void => {
      if (__DEV__) {
        console.debug(`[${context}]`, ...args);
      }
    },
    info: (...args: unknown[]): void => {
      console.log(`[${context}]`, ...processArgs(args));
    },
    warn: (...args: unknown[]): void => {
      console.warn(`[${context}]`, ...processArgs(args));
    },
    error: (...args: unknown[]): void => {
      console.error(`[${context}]`, ...processArgs(args));
    },
  }),
};

export default logger;
