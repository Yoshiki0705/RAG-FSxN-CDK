import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'Permission-aware RAG with NetApp ONTAP',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
}