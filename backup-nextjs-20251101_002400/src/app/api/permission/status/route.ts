import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    permissions: {
      read: true,
      write: false,
      admin: false
    },
    user: 'anonymous',
    timestamp: new Date().toISOString()
  });
}