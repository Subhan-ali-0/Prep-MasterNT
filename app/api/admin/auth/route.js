import {NextResponse} from 'next/server';import {makeSession,cookieOpts,COOKIE} import { ... } from '../../../../../lib/admin';
export async function POST(req){const {password=''}=await req.json();if(!process.env.ADMIN_PASSWORD||password!==process.env.ADMIN_PASSWORD)return NextResponse.json({success:false,error:'Invalid password'},{status:401});const r=NextResponse.json({success:true});r.cookies.set(COOKIE,makeSession(),cookieOpts());return r}
export async function DELETE(){const r=NextResponse.json({success:true});r.cookies.set(COOKIE,'',{...cookieOpts(),maxAge:0});return r}
