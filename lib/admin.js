import crypto from 'crypto';
export const COOKIE='pm_admin_session';
function secret(){return process.env.ADMIN_API_KEY||process.env.ADMIN_PASSWORD||''}
export function makeSession(){const s=secret();const p=`prep-master:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;const sig=crypto.createHmac('sha256',s).update(p).digest('hex');return `${Buffer.from(p).toString('base64url')}.${sig}`}
export function validSession(v){if(!v||!secret())return false;const [e,s]=v.split('.');if(!e||!s)return false;const p=Buffer.from(e,'base64url').toString();const x=crypto.createHmac('sha256',secret()).update(p).digest('hex');return s.length===x.length&&crypto.timingSafeEqual(Buffer.from(s),Buffer.from(x))}
export function cookieOpts(){return {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:604800}}
