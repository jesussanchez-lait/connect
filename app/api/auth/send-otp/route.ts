import { NextRequest, NextResponse } from "next/server";
import { LoginCredentials } from "@/src/domain/entities/AuthCredentials";
import { generateOtp, saveOtp } from "../otp-store";

export async function POST(request: NextRequest) {
  try {
    const body: LoginCredentials = await request.json();

    if (!body.phoneNumber || body.phoneNumber.length < 10) {
      return NextResponse.json(
        { success: false, message: "Número de celular inválido" },
        { status: 400 }
      );
    }

    // Generar código OTP de 6 dígitos
    const otpCode = generateOtp();

    // Guardar OTP en memoria (solo para desarrollo)
    saveOtp(body.phoneNumber, otpCode, 10); // Expira en 10 minutos

    // En producción, aquí enviarías el OTP por SMS usando un servicio como Twilio, AWS SNS, etc.
    // await smsService.send(body.phoneNumber, `Tu código OTP es: ${otpCode}`);

    // En desarrollo, retornamos el código para que el usuario pueda ingresarlo
    const isDevelopment = process.env.NODE_ENV === "development";

    return NextResponse.json({
      success: true,
      message: "Código OTP enviado exitosamente",
      ...(isDevelopment && { otpCode }), // Solo en desarrollo
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Error al enviar OTP" },
      { status: 500 }
    );
  }
}
