import { NextRequest, NextResponse } from "next/server";

// Mock API endpoint - Replace with actual QR code generation logic
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

    // Mock user ID - In production, extract from token
    const userId = "1";
    const leaderName = "Demo User";

    // Generate QR code URL - In production, this would be your registration URL with leaderId and campaignId
    const registrationUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/register?leaderId=${userId}&leaderName=${encodeURIComponent(
      leaderName
    )}&campaignId=${campaignId}`;

    return NextResponse.json({
      qrData: registrationUrl,
      userId: userId,
      campaignId: campaignId,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error al generar código QR" },
      { status: 500 }
    );
  }
}
