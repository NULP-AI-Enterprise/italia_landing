/**
 * Cloudflare Turnstile keys, read at request time so they can live in the
 * Kubernetes secret (a NEXT_PUBLIC_* variable would be fixed at build time).
 * The captcha is on only when both keys are set.
 */
export function turnstileSiteKey(): string | undefined {
  return process.env.TURNSTILE_SECRET_KEY ? process.env.TURNSTILE_SITE_KEY || undefined : undefined;
}

export function turnstileSecret(): string | undefined {
  return process.env.TURNSTILE_SITE_KEY ? process.env.TURNSTILE_SECRET_KEY || undefined : undefined;
}
