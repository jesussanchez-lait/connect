import { NextRequest, NextResponse } from 'next/server';
import { RegisterCredentials } from '@/src/domain/entities/AuthCredentials';

// Mock API endpoint - Replace with actual registration logic
export async function POST(request: NextRequest) {
  try {
    const body: RegisterCredentials = await request.json();
    
    // Mock validation - Replace with actual database check
    if (!body.email || !body.password || !body.name) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Mock user creation
    const mockUser = {
      id: Date.now().toString(),
      email: body.email,
      name: body.name,
      createdAt: new Date(),
    };

    return NextResponse.json({
      user: mockUser,
      tokens: {
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Invalid request' },
      { status: 400 }
    );
  }
}

