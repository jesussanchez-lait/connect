import { NextRequest, NextResponse } from "next/server";

// Mock API endpoint - Replace with actual database query
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Mock activities - In production, query database for registrations under current user's QR code
    const mockActivities = [
      {
        id: "act-1",
        userId: "2",
        userName: "Juan Pérez",
        action: "Registro completado",
        city: "Bogotá",
        department: "Cundinamarca",
        createdAt: new Date("2024-01-15T10:30:00"),
      },
      {
        id: "act-2",
        userId: "3",
        userName: "María García",
        action: "Registro completado",
        city: "Medellín",
        department: "Antioquia",
        createdAt: new Date("2024-01-20T14:15:00"),
      },
      {
        id: "act-3",
        userId: "4",
        userName: "Carlos Rodríguez",
        action: "Registro completado",
        city: "Cali",
        department: "Valle del Cauca",
        createdAt: new Date("2024-02-01T09:45:00"),
      },
    ];

    return NextResponse.json(mockActivities);
  } catch (error) {
    return NextResponse.json(
      { message: "Error al obtener actividades" },
      { status: 500 }
    );
  }
}
