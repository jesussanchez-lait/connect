import { NextRequest, NextResponse } from "next/server";
import { dashboardHandlers } from "@/src/infrastructure/mocks/mockHandlers";

export async function POST(
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

    const result = await dashboardHandlers.approveMultiplierRequest(
      requestId,
      token
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Error al aprobar solicitud" },
      { status: error.status || 500 }
    );
  }
}
