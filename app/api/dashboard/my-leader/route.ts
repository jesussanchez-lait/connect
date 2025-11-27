import { NextRequest, NextResponse } from "next/server";

// Mock API endpoint - Replace with actual database query
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Mock leader - In production, query database where id = currentUser.leaderId
    const mockLeader = {
      id: "leader-1",
      name: "Ana Martínez",
      phoneNumber: "+573001234560",
      email: "ana.martinez@example.com",
      photo:
        "https://ui-avatars.com/api/?name=Ana+Martinez&background=6366f1&color=fff&size=128",
    };

    return NextResponse.json(mockLeader);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al obtener multiplicador" },
      { status: 500 }
    );
  }
}
