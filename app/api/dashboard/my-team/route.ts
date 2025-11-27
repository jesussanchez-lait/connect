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

    // Mock team members - In production, query database where leaderId = currentUserId AND campaignId = campaignId
    const mockTeam = [
      {
        id: "2",
        name: "Juan Pérez",
        phoneNumber: "+573001234567",
        city: "Bogotá",
        department: "Cundinamarca",
        neighborhood: "Chapinero",
        latitude: 4.6533,
        longitude: -74.0836,
        createdAt: new Date("2024-01-15"),
      },
      {
        id: "3",
        name: "María García",
        phoneNumber: "+573001234568",
        city: "Medellín",
        department: "Antioquia",
        neighborhood: "El Poblado",
        latitude: 6.2476,
        longitude: -75.5658,
        createdAt: new Date("2024-01-20"),
      },
      {
        id: "4",
        name: "Carlos Rodríguez",
        phoneNumber: "+573001234569",
        city: "Cali",
        department: "Valle del Cauca",
        neighborhood: "San Fernando",
        latitude: 3.4516,
        longitude: -76.532,
        createdAt: new Date("2024-02-01"),
      },
    ];

    return NextResponse.json(mockTeam);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al obtener equipo" },
      { status: 500 }
    );
  }
}
