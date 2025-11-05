import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    // 基本的な認証ロジック（実際の認証は後で実装）
    const validUsers = ['testuser', 'admin'];
    const validPassword = 'password';
    
    if (validUsers.includes(username) && password === validPassword) {
      return NextResponse.json({
        success: true,
        user: { username },
        token: 'mock-jwt-token',
        redirectUrl: '/chatbot'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Auth Signin API is running',
    timestamp: new Date().toISOString()
  });
}