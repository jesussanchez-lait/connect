import { NextRequest, NextResponse } from "next/server";

// Mock API endpoint - Replace with actual user retrieval logic
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Mock user - Replace with actual token validation and user retrieval
    // In production, extract user ID from token and query database
    const mockUser = {
      id: "1",
      email: "demo@example.com",
      name: "Demo User",
      phoneNumber: "+573001234500",
      documentNumber: "1234567890",
      country: "Colombia",
      department: "Cundinamarca",
      city: "Bogotá",
      neighborhood: "Centro",
      latitude: 4.6097,
      longitude: -74.0817,
      createdAt: new Date("2024-01-01"),
    };

    return NextResponse.json(mockUser);
  } catch (error) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
