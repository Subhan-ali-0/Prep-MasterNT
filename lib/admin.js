import crypto from 'crypto';

export const COOKIE = 'pm_admin_session';

export function makeSession() {
  const secret = process.env.ADMIN_API_KEY || process.env.ADMIN_PASSWORD || '';
  return crypto
    .createHmac('sha256', secret)
    .update('prep-master-admin')
    .digest('hex');
}

export function validSession(value) {
  if (!value) return false;
  if (!process.env.ADMIN_API_KEY && !process.env.ADMIN_PASSWORD) return false;

  const a = Buffer.from(String(value));
  const b = Buffer.from(makeSession());

  // timingSafeEqual throws on length mismatch, which would turn a bad cookie into a 500.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function cookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}
