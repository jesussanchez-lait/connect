import { NextRequest, NextResponse } from "next/server";

// Mock API endpoint - Frontend now uses Firebase directly via useTeam hook
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

    // Mock team members - Frontend now uses Firebase directly via useTeam hook
    // This endpoint is kept for backward compatibility with mock server
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
        teamSize: 5, // 5 personas registradas bajo su código QR
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
        teamSize: 12, // 12 personas registradas bajo su código QR
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
        teamSize: 0, // Sin personas registradas aún
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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validar campos requeridos
    if (
      !body.campaignId ||
      !body.firstName ||
      !body.lastName ||
      !body.phoneNumber ||
      !body.department ||
      !body.city ||
      !body.neighborhood
    ) {
      return NextResponse.json(
        { message: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    if (body.phoneNumber.length < 10) {
      return NextResponse.json(
        { message: "Número de teléfono inválido" },
        { status: 400 }
      );
    }

    // Mock user ID - In production, extract from token
    const userId = "1";

    // En producción, aquí crearías el miembro del equipo en la base de datos
    // asociado al currentUserId como leaderId y con el campaignId
    const fullName = `${body.firstName} ${body.lastName}`;
    const newMember = {
      id: Date.now().toString(),
      name: fullName,
      phoneNumber: body.phoneNumber,
      city: body.city,
      department: body.department,
      neighborhood: body.neighborhood,
      latitude: undefined,
      longitude: undefined,
      createdAt: new Date(),
      teamSize: 0, // Nuevo miembro sin equipo aún
    };

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error al agregar miembro al equipo" },
      { status: 500 }
    );
  }
}
