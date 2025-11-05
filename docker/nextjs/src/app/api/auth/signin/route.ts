import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  
  // シンプルな認証チェック（元の実装に合わせて後で AWS Cognito に置き換え可能）
  const validUsers = ['testuser', 'admin'];
  const validTestUsers = Array.from({length: 50}, (_, i) => `testuser${i}`);
  const allValidUsers = [...validUsers, ...validTestUsers];
  
  if (allValidUsers.includes(username) && password === 'password') {
    return NextResponse.json({ 
      message: "Sign-in successful",
      AuthenticationResult: {
        IdToken: "mock-jwt-token"
      }
    }, { status: 200 });
  } else {
    return NextResponse.json({ 
      message: "Invalid username or password" 
    }, { status: 401 });
  }
}
