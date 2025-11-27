import { NextRequest, NextResponse } from "next/server";
import { RegisterCredentials } from "@/src/domain/entities/AuthCredentials";

export async function POST(request: NextRequest) {
  try {
    const body: RegisterCredentials = await request.json();

    if (
      !body.phoneNumber ||
      !body.firstName ||
      !body.lastName ||
      !body.documentNumber ||
      !body.country ||
      !body.department ||
      !body.city ||
      !body.neighborhood ||
      !body.leaderId ||
      !body.leaderName ||
      !body.campaignId
    ) {
      return NextResponse.json(
        { message: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    if (body.phoneNumber.length < 10) {
      return NextResponse.json(
        { message: "Número de celular inválido" },
        { status: 400 }
      );
    }

    // En producción, aquí crearías el usuario en la base de datos
    // y asociarías el leaderId, leaderName y campaignId
    const fullName = `${body.firstName} ${body.lastName}`;
    const mockUser = {
      id: Date.now().toString(),
      email: `${body.phoneNumber}@phone.local`,
      name: fullName,
      documentNumber: body.documentNumber,
      phoneNumber: body.phoneNumber,
      country: body.country,
      department: body.department,
      city: body.city,
      neighborhood: body.neighborhood,
      latitude: body.latitude,
      longitude: body.longitude,
      leaderId: body.leaderId,
      leaderName: body.leaderName,
      campaignId: body.campaignId,
      createdAt: new Date(),
    };

    return NextResponse.json({
      user: mockUser,
      tokens: {
        accessToken: "mock-access-token-" + Date.now(),
        refreshToken: "mock-refresh-token-" + Date.now(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Error al registrar usuario" },
      { status: 500 }
    );
  }
}
