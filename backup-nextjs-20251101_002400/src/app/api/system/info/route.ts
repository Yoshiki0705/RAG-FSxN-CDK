import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    system: 'Permission-aware RAG with NetApp ONTAP',
    environment: process.env.NODE_ENV || 'development',
    region: process.env.AWS_REGION || 'ap-northeast-1',
    timestamp: new Date().toISOString()
  });
}