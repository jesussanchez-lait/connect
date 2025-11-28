import { NextRequest, NextResponse } from "next/server";

// Mock API endpoint - Replace with actual PDF generation logic
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

    // Mock campaign data - In production, fetch from database
    const mockCampaigns: Record<string, any> = {
      "camp-1": {
        id: "camp-1",
        name: "Campaña Verano 2024",
        description: "Campaña de verano para nuevos registros",
        startDate: "2024-06-01",
        endDate: "2024-08-31",
        participants: 150,
      },
      "camp-2": {
        id: "camp-2",
        name: "Campaña Navidad 2024",
        description: "Campaña especial de navidad",
        startDate: "2024-11-01",
        endDate: "2024-12-31",
        participants: 89,
      },
      "camp-3": {
        id: "camp-3",
        name: "Campaña Año Nuevo 2025",
        description: "Campaña de inicio de año",
        startDate: "2025-01-01",
        endDate: "2025-03-31",
        participants: 234,
      },
    };

    const campaign = mockCampaigns[campaignId] || mockCampaigns["camp-1"];

    // Generate a simple PDF-like document (in production, use a library like pdfkit or puppeteer)
    // For now, we'll return a simple text document that can be converted to PDF
    const proposalContent = `
PROPUESTA DE CAMPAÑA

${campaign.name}

DESCRIPCIÓN
${campaign.description}

PERÍODO
Fecha de inicio: ${new Date(campaign.startDate).toLocaleDateString("es-CO")}
Fecha de fin: ${new Date(campaign.endDate).toLocaleDateString("es-CO")}

ESTADÍSTICAS
Participantes actuales: ${campaign.participants}

OBJETIVOS
- Incrementar la base de usuarios registrados
- Expandir la red de contactos
- Generar crecimiento orgánico mediante referidos

METODOLOGÍA
- Sistema de códigos QR únicos por usuario
- Seguimiento de registros por campaña
- Reportes de actividad en tiempo real

BENEFICIOS
- Crecimiento medible y rastreable
- Sistema de referidos escalable
- Análisis detallado de participación

---

Este documento fue generado el ${new Date().toLocaleDateString("es-CO")}
`;

    // Create a simple PDF-like response
    // In production, use a proper PDF generation library
    const response = new NextResponse(proposalContent, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="propuesta-campana-${campaign.name.replace(
          /\s+/g,
          "-"
        )}.pdf"`,
      },
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { message: "Error al generar propuesta de campaña" },
      { status: 500 }
    );
  }
}
