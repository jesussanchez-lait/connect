import { NextRequest, NextResponse } from "next/server";

// Mock API endpoint - Replace with actual database query
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Mock campaigns - In production, query database for active campaigns where user is a member
    const mockCampaigns = [
      {
        id: "camp-1",
        name: "Campaña Verano 2024",
        description: "Campaña de verano para nuevos registros",
        startDate: new Date("2024-06-01"),
        endDate: new Date("2024-08-31"),
        status: "active",
        participants: 150,
        createdAt: new Date("2024-05-15"),
      },
      {
        id: "camp-2",
        name: "Campaña Navidad 2024",
        description: "Campaña especial de navidad",
        startDate: new Date("2024-11-01"),
        endDate: new Date("2024-12-31"),
        status: "active",
        participants: 89,
        createdAt: new Date("2024-10-20"),
      },
      {
        id: "camp-3",
        name: "Campaña Año Nuevo 2025",
        description: "Campaña de inicio de año",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-03-31"),
        status: "active",
        participants: 234,
        createdAt: new Date("2024-12-15"),
      },
    ];

    return NextResponse.json(mockCampaigns);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al obtener campañas" },
      { status: 500 }
    );
  }
}
