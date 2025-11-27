import { NextRequest, NextResponse } from "next/server";

// Mock API endpoint - Replace with actual user retrieval logic
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Mock user - Replace with actual token validation and user retrieval
    const mockUser = {
      id: "1",
      email: "demo@example.com",
      name: "Demo User",
      createdAt: new Date(),
    };

    return NextResponse.json(mockUser);
  } catch (error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
