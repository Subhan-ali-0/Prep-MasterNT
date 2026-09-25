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

  const expected = makeSession();

  return crypto.timingSafeEqual(
    Buffer.from(value),
    Buffer.from(expected)
  );
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
