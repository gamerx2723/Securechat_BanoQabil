/**
 * SecureChat Zero-Trust Input Sanitizer & Normalizer
 * Standardizes inputs across all client & API layers.
 */

/**
 * Normalizes phone numbers to standard E.164 canonical format (+<country_code><number>)
 * Examples:
 *  - "0303 7701455" -> "+923037701455"
 *  - "0303-7701455" -> "+923037701455"
 *  - "923037701455" -> "+923037701455"
 *  - "00923037701455" -> "+923037701455"
 *  - "+92 303 7701455" -> "+923037701455"
 *  - "+1 (555) 234-5678" -> "+15552345678"
 */
export function normalizePhoneNumber(raw: string | undefined | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  // Case: Pakistani domestic mobile 03XX XXXXXXX (11 digits)
  if (digits.startsWith('03') && digits.length === 11) {
    return `+92${digits.substring(1)}`;
  }

  // Case: Pakistani domestic starting with 0092
  if (digits.startsWith('0092') && digits.length >= 13) {
    return `+${digits.substring(2)}`;
  }

  // Case: Pakistani international without plus: 923XX XXXXXXX (12 digits)
  if (digits.startsWith('92') && digits.length === 12) {
    return `+${digits}`;
  }

  // Case: Already formatted with international + prefix
  if (trimmed.startsWith('+')) {
    return `+${digits}`;
  }

  // Generic fallback: Prefix with '+'
  return `+${digits}`;
}

/**
 * Normalizes usernames:
 * - Trims whitespace
 * - Converts to lowercase
 * - Replaces spaces and invalid characters with underscores
 * - Limits to valid alphanumeric characters, dots, hyphens, underscores
 */
export function normalizeUsername(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 30);
}

/**
 * Normalizes email addresses:
 * - Trims whitespace
 * - Converts to lowercase
 */
export function normalizeEmail(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw.trim().toLowerCase();
}

/**
 * Sanitizes plain text to prevent XSS and control character exploits:
 * - Strips script tags, HTML tags, and dangerous markup
 * - Strips null bytes and invisible control characters
 */
export function sanitizeText(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw
    .replace(/\0/g, '') // remove null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // remove script tags
    .replace(/<[^>]+>/g, '') // strip HTML tags
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // remove ASCII control characters
    .trim();
}

/**
 * Normalizes display names:
 * - Strips HTML/XSS markup
 * - Collapses multiple spaces into single space
 * - Trims and limits to 50 characters
 */
export function normalizeDisplayName(raw: string | undefined | null): string {
  if (!raw) return '';
  const sanitized = sanitizeText(raw);
  return sanitized.replace(/\s+/g, ' ').slice(0, 50);
}
