// Almacenamiento temporal en memoria para desarrollo
// En producción, esto debería estar en una base de datos o servicio de caché
const otpStore = new Map<string, { code: string; expiresAt: number }>();

// Normalizar número de teléfono (remover espacios, guiones, etc.)
function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, "");
}

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
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
  otpStore.set(normalizedPhone, { code, expiresAt });

  // Debug logs (solo en desarrollo)
  if (process.env.NODE_ENV === "development") {
    console.log("💾 OTP guardado:", {
      originalPhone: phoneNumber,
      normalizedPhone,
      code,
      expiresAt,
      expiresIn: `${expiresInMinutes} minutos`,
      storeSize: otpStore.size,
    });
  }
}

// Verificar OTP
export function verifyOtpCode(phoneNumber: string, code: string): boolean {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const stored = otpStore.get(normalizedPhone);

  // Debug logs (solo en desarrollo)
  if (process.env.NODE_ENV === "development") {
    const normalizedCode = code.replace(/\D/g, "");
    console.log("🔍 Verificando OTP:", {
      originalPhone: phoneNumber,
      normalizedPhone,
      originalCode: code,
      normalizedCode,
      stored: stored
        ? { code: stored.code, expiresAt: stored.expiresAt }
        : null,
      currentTime: Date.now(),
      storeSize: otpStore.size,
      allKeys: Array.from(otpStore.keys()),
    });
  }

  if (!stored) {
    console.log("❌ No se encontró OTP para:", normalizedPhone);
    return false;
  }

  if (Date.now() > stored.expiresAt) {
    console.log("❌ OTP expirado:", {
      expiresAt: stored.expiresAt,
      currentTime: Date.now(),
      diff: Date.now() - stored.expiresAt,
    });
    otpStore.delete(normalizedPhone);
    return false;
  }

  // Normalizar código OTP (remover espacios y solo dejar dígitos)
  const normalizedCode = code.replace(/\D/g, "");

  if (stored.code !== normalizedCode) {
    console.log("❌ Código OTP no coincide:", {
      expected: stored.code,
      received: normalizedCode,
      originalReceived: code,
    });
    return false;
  }

  // OTP verificado correctamente, eliminarlo
  console.log("✅ OTP verificado correctamente");
  otpStore.delete(normalizedPhone);
  return true;
}
