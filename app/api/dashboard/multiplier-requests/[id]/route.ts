import { NextRequest, NextResponse } from "next/server";
import { dashboardHandlers } from "@/src/infrastructure/mocks/mockHandlers";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const requestId = params.id;

    const result = await dashboardHandlers.getMultiplierRequestById(
      requestId,
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const token = authHeader.substring(7);
    const requestId = params.id;

    const result = await dashboardHandlers.updateMultiplierRequest(
      requestId,
      body,
      token
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Error al actualizar solicitud" },
      { status: error.status || 500 }
    );
  }
}
