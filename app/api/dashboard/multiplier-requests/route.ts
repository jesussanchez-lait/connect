import { NextRequest, NextResponse } from "next/server";
import { dashboardHandlers } from "@/src/infrastructure/mocks/mockHandlers";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const reviewerId = searchParams.get("reviewerId");
    const token = authHeader.substring(7);

    if (!campaignId) {
      return NextResponse.json(
        { message: "campaignId es requerido" },
        { status: 400 }
      );
    }

    const result = await dashboardHandlers.getMultiplierRequests(
      campaignId,
      reviewerId,
      token
    );

    return NextResponse.json(result || []);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Error al obtener solicitudes" },
      { status: error.status || 500 }
    );
  }
}
