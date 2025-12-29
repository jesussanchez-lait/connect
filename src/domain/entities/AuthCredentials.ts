export interface LoginCredentials {
  phoneNumber: string;
}

export interface EmailPasswordCredentials {
  email: string;
  password: string;
}

export interface GoogleSignInCredentials {
  // No necesita campos adicionales, Google maneja todo
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

import { AreaType, Gender } from "./User";

export interface RegisterCredentials {
  // Datos personales
  firstName: string;
  lastName: string;
  documentNumber: string; // Cédula
  phoneNumber?: string; // WhatsApp (opcional para email/Google)
  email?: string; // Email (opcional para teléfono)
  password?: string; // Contraseña (solo para email/password)
  gender?: Gender; // Sexo del usuario
  profession?: string; // Profesión del usuario

  // Datos territoriales
  country: string;
  department: string;
  city: string;
  address: string; // Dirección completa (con autocomplete de Google Maps)
  neighborhood: string; // Barrio / Vereda
  latitude?: number;
  longitude?: number;
  areaType?: AreaType; // URBAN o RURAL basado en la ciudad
  fromCapitalCity?: boolean; // true si la ciudad es la capital del departamento

  // Datos del multiplicador (opcionales para admin)
  leaderId?: string;
  leaderName?: string;

  // Datos de la campaña (opcional para admin)
  campaignId?: string;
}

export interface PartialUserCredentials {
  id: string;
  // Datos personales (del paso 1)
  firstName: string;
  lastName: string;
  documentNumber: string;
  phoneNumber: string;

  // Datos del multiplicador (opcionales para admin)
  leaderId?: string;
  leaderName?: string;

  // Datos de la campaña (opcional para admin)
  campaignId?: string;
}
