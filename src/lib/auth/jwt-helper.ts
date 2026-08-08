/**
 * Decodes a JWT token and returns its payload.
 * Supports both Node.js (Buffer) and Edge (atob) runtimes.
 */
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    
    // Check if Buffer is available (Node.js runtime)
    if (typeof Buffer !== "undefined") {
      const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
      return JSON.parse(jsonPayload);
    }
    
    // Fallback for Edge/Browser environment where Buffer might not be defined
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0)!);
    const jsonPayload = new TextDecoder().decode(bytes);
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

/**
 * True if the JWT is absent, undecodable, or at/near expiry. `skewSeconds`
 * guards against clock drift and in-flight latency — a token expiring within
 * the window is treated as already expired so callers refresh proactively.
 * Anything we can't read an `exp` from is treated as expired (fail safe).
 */
export function isJwtExpired(token: string, skewSeconds = 30): boolean {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return payload.exp <= Date.now() / 1000 + skewSeconds;
}

/**
 * Calculates the total lifetime of a JWT token in seconds based on `exp` and `iat`.
 * Falls back to the provided fallback value if the token is invalid or does not contain these claims.
 */
export function getTokenLifetime(token: string, fallbackSeconds: number): number {
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== "number" || typeof payload.iat !== "number") {
    return fallbackSeconds;
  }
  const lifetime = payload.exp - payload.iat;
  return lifetime > 0 ? lifetime : fallbackSeconds;
}
