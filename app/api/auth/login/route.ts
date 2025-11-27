import { NextRequest, NextResponse } from 'next/server';
import { LoginCredentials } from '@/src/domain/entities/AuthCredentials';

// Mock API endpoint - Replace with actual authentication logic
export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();
    
    // Mock validation - Replace with actual database check
    if (body.email === 'demo@example.com' && body.password === 'password123') {
      const mockUser = {
        id: '1',
        email: body.email,
        name: 'Demo User',
        createdAt: new Date(),
      };

      return NextResponse.json({
        user: mockUser,
        tokens: {
          accessToken: 'mock-access-token-' + Date.now(),
          refreshToken: 'mock-refresh-token-' + Date.now(),
        },
      });
    }

    return NextResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'Invalid request' },
      { status: 400 }
    );
  }
}

