/**
 * Token configuration loader
 *
 * Reads valid tokens from the VALID_TOKENS environment variable.
 * Format: "token1:user_id1,token2:user_id2"
 * Example: "my-secret-token-001:user_001,my-secret-token-002:user_002"
 */

export interface TokenEntry {
  token: string;
  userId: string;
}

let tokenMap: Map<string, string> | null = null;

export function loadTokens(): Map<string, string> {
  if (tokenMap !== null) {
    return tokenMap;
  }

  tokenMap = new Map<string, string>();

  const raw = process.env.VALID_TOKENS ?? '';
  if (!raw) {
    console.warn('[tokens] VALID_TOKENS env var is not set — no tokens will be accepted');
    return tokenMap;
  }

  const entries = raw.split(',');
  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      console.warn(`[tokens] Ignoring malformed entry (no colon): "${trimmed}"`);
      continue;
    }

    const token = trimmed.substring(0, colonIdx).trim();
    const userId = trimmed.substring(colonIdx + 1).trim();

    if (!token || !userId) {
      console.warn(`[tokens] Ignoring malformed entry (empty token or userId): "${trimmed}"`);
      continue;
    }

    tokenMap.set(token, userId);
  }

  console.info(`[tokens] Loaded ${tokenMap.size} valid token(s)`);
  return tokenMap;
}

/** Force reload (useful for hot-reload scenarios in dev) */
export function reloadTokens(): Map<string, string> {
  tokenMap = null;
  return loadTokens();
}
