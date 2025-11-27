import { NextRequest, NextResponse } from "next/server";

// Mock API endpoint - Replace with actual database query
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get campaignId from query parameters
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { message: "campaignId es requerido" },
        { status: 400 }
      );
    }

    // Mock leader - In production, query database where id = currentUser.leaderId AND campaignId = campaignId
    // Different campaigns might have different leaders
    const mockLeaders: Record<string, any> = {
      "camp-1": {
        id: "leader-1",
        name: "Ana Martínez",
        phoneNumber: "+573001234560",
        email: "ana.martinez@example.com",
        photo:
          "https://ui-avatars.com/api/?name=Ana+Martinez&background=6366f1&color=fff&size=128",
      },
      "camp-2": {
        id: "leader-2",
        name: "Pedro González",
        phoneNumber: "+573001234561",
        email: "pedro.gonzalez@example.com",
        photo:
          "https://ui-avatars.com/api/?name=Pedro+Gonzalez&background=10b981&color=fff&size=128",
      },
      "camp-3": {
        id: "leader-3",
        name: "Laura Sánchez",
        phoneNumber: "+573001234562",
        email: "laura.sanchez@example.com",
        photo:
          "https://ui-avatars.com/api/?name=Laura+Sanchez&background=f59e0b&color=fff&size=128",
      },
    };

    const mockLeader = mockLeaders[campaignId] || mockLeaders["camp-1"]; // Default to first campaign's leader

    return NextResponse.json(mockLeader);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al obtener multiplicador" },
      { status: 500 }
    );
  }
}
