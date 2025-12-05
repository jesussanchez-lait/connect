export interface LoginCredentials {
  phoneNumber: string;
}

export interface OtpVerification {
  phoneNumber: string;
  otpCode: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  otpCode?: string; // Solo en desarrollo
}

export interface RegisterCredentials {
  // Datos personales
  firstName: string;
  lastName: string;
  documentNumber: string; // Cédula
  phoneNumber: string; // WhatsApp

  // Datos territoriales
  country: string;
  department: string;
  city: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;

  // Datos del multiplicador
  leaderId: string;
  leaderName: string;

  // Datos de la campaña
  campaignId: string;
}

export interface PartialUserCredentials {
  // Datos personales (del paso 1)
  firstName: string;
  lastName: string;
  documentNumber: string;
  phoneNumber: string;

  // Datos del multiplicador
  leaderId: string;
  leaderName: string;

  // Datos de la campaña
  campaignId: string;
}
