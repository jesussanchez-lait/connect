// Almacenamiento temporal en memoria para desarrollo
// En producción, esto debería estar en una base de datos o servicio de caché
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// Generar código OTP de 6 dígitos
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Guardar OTP
export function saveOtp(
  phoneNumber: string,
  code: string,
  expiresInMinutes: number = 10
): void {
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  otpStore.set(phoneNumber, { code, expiresAt });
}

// Verificar OTP
export function verifyOtpCode(phoneNumber: string, code: string): boolean {
  const stored = otpStore.get(phoneNumber);

  if (!stored) {
    return false;
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(phoneNumber);
    return false;
  }

  if (stored.code !== code) {
    return false;
  }

  // OTP verificado correctamente, eliminarlo
  otpStore.delete(phoneNumber);
  return true;
}
