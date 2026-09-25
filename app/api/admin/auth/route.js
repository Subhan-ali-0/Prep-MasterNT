import { NextResponse } from 'next/server';
import {
  makeSession,
  cookieOpts,
  COOKIE,
} from '../../../../lib/admin';

export async function POST(req) {
  const { password = '' } = await req.json();

  if (
    !process.env.ADMIN_PASSWORD ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json(
      { success: false, error: 'Invalid password' },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set(
    COOKIE,
    makeSession(),
    cookieOpts()
  );

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(
    COOKIE,
    '',
    {
      ...cookieOpts(),
      maxAge: 0,
    }
  );

  return response;
}
