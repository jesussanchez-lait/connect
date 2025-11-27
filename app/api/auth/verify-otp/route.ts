import { NextRequest, NextResponse } from "next/server";
import { OtpVerification } from "@/src/domain/entities/AuthCredentials";
import { verifyOtpCode } from "../otp-store";

export async function POST(request: NextRequest) {
  try {
    const body: OtpVerification = await request.json();

    if (!body.phoneNumber || !body.otpCode) {
      return NextResponse.json(
        { message: "Número de celular y código OTP son requeridos" },
        { status: 400 }
      );
    }

    if (body.otpCode.length !== 6) {
      return NextResponse.json(
        { message: "El código OTP debe tener 6 dígitos" },
        { status: 400 }
      );
    }

    // Verificar el código OTP
    const isValid = verifyOtpCode(body.phoneNumber, body.otpCode);

    if (!isValid) {
      return NextResponse.json(
        { message: "Código OTP inválido o expirado" },
        { status: 401 }
      );
    }

    // OTP válido, crear sesión de usuario
    // En producción, aquí buscarías o crearías el usuario en la base de datos
    const mockUser = {
      id: Date.now().toString(),
      email: `${body.phoneNumber}@phone.local`,
      name: `Usuario ${body.phoneNumber}`,
      phoneNumber: body.phoneNumber,
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
      { message: "Error al verificar OTP" },
      { status: 500 }
    );
  }
}
