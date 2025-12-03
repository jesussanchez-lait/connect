import { NextRequest, NextResponse } from "next/server";
import { dashboardHandlers } from "@/src/infrastructure/mocks/mockHandlers";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const token = authHeader.substring(7);

    // Validar campos requeridos
    if (!body.campaignId) {
      return NextResponse.json(
        { message: "campaignId es requerido" },
        { status: 400 }
      );
    }

    const result = await dashboardHandlers.createMultiplierRequest(body, token);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Error al crear solicitud" },
      { status: error.status || 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const campaignId = searchParams.get("campaignId");
    const token = authHeader.substring(7);

    if (!userId || !campaignId) {
      return NextResponse.json(
        { message: "userId y campaignId son requeridos" },
        { status: 400 }
      );
    }

    const result = await dashboardHandlers.getMultiplierRequestByUser(
      userId,
      campaignId,
      token
    );

    if (!result) {
      return NextResponse.json(
        { message: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.status === 404) {
      return NextResponse.json(
        { message: "Solicitud no encontrada" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: error.message || "Error al obtener solicitud" },
      { status: error.status || 500 }
    );
  }
}
