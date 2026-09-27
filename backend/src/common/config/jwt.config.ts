/**
 * Safe, centralized JWT Secret Resolver.
 * In production, it strictly requires JWT_SECRET from environment variables to prevent token forgery attacks.
 * In development / local testing, it uses a non-production fallback so local dev works without friction.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing in production! System cannot start with insecure default secret.',
      );
    }
    return 'safnexbd_dev_only_jwt_secret_change_me_in_production_39847298374';
  }
  return secret;
}

export function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL SECURITY ERROR: JWT_REFRESH_SECRET environment variable is missing in production! System cannot start with insecure default secret.',
      );
    }
    return 'safnexbd_dev_only_jwt_refresh_key_change_me_in_production_8923471092';
  }
  return secret;
}
