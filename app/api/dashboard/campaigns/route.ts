import { NextRequest, NextResponse } from "next/server";

// Mock API endpoint - Replace with actual database query
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, startDate, endDate, status } = body;

    // Validaciones
    if (!name || !description || !startDate || !endDate) {
      return NextResponse.json(
        { message: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Validar fechas
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return NextResponse.json(
        { message: "La fecha de fin debe ser posterior a la fecha de inicio" },
        { status: 400 }
      );
    }

    // En producción, aquí se guardaría en la base de datos
    // Por ahora, simulamos la creación de una campaña
    const newCampaign = {
      id: `camp-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      startDate: startDate,
      endDate: endDate,
      status: status || "active",
      participants: 0,
      createdAt: new Date().toISOString(),
    };

    // TODO: Guardar en Firestore
    // const db = getFirestore();
    // await setDoc(doc(db, "campaigns", newCampaign.id), {
    //   ...newCampaign,
    //   createdAt: serverTimestamp(),
    // });

    return NextResponse.json(newCampaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { message: "Error al crear la campaña" },
      { status: 500 }
    );
  }
}

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
