import { loadTokens } from '../config/tokens';

export interface ValidationResult {
  valid: boolean;
  userId?: string;
  errorCode?: 'missing_or_invalid_format' | 'token_not_found';
}

/**
 * Validates an Authorization header value.
 * Expected format: "Bearer <token>"
 */
export function validateAuthorization(authHeader: string | undefined): ValidationResult {
  // 1. Check header presence
  if (!authHeader) {
    return { valid: false, errorCode: 'missing_or_invalid_format' };
  }

  // 2. Check format: must start with "Bearer "
  const BEARER_PREFIX = 'Bearer ';
  if (!authHeader.startsWith(BEARER_PREFIX)) {
    return { valid: false, errorCode: 'missing_or_invalid_format' };
  }

  // 3. Extract token value
  const token = authHeader.substring(BEARER_PREFIX.length).trim();
  if (!token) {
    return { valid: false, errorCode: 'missing_or_invalid_format' };
  }

  // 4. Lookup token in the map
  const tokens = loadTokens();
  const userId = tokens.get(token);

  if (!userId) {
    return { valid: false, errorCode: 'token_not_found' };
  }

  return { valid: true, userId };
}
