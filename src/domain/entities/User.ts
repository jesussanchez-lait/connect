export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "COORDINATOR"
  | "LINK"
  | "MULTIPLIER"
  | "FOLLOWER";

export type AreaType = "URBAN" | "RURAL";
export type Gender = "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";

export interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  name: string;
  role?: UserRole; // Rol del usuario en el sistema
  documentNumber?: string;
  gender?: Gender; // Sexo del usuario
  profession?: string; // Profesión del usuario
  country?: string;
  department?: string;
  city?: string;
  address?: string; // Dirección completa
  neighborhood?: string; // Barrio / Vereda
  latitude?: number;
  longitude?: number;
  areaType?: AreaType; // URBAN o RURAL basado en la ciudad
  fromCapitalCity?: boolean; // true si la ciudad es la capital del departamento
  leaderId?: string;
  leaderName?: string;
  campaignIds?: string[]; // Lista de IDs de campañas asociadas al usuario
  participants?: number; // Cantidad de personas registradas bajo este multiplicador
  createdAt: Date;
  // Campos de autenticación y validación
  preferredAuthMethod?: "otp" | "credentials" | "google"; // Método de autenticación preferido
  identityVerificationStatus?: "pending" | "verified" | "failed" | "blocked"; // Estado de validación de identidad (opcional)
  identityVerificationAttempts?: number; // Intentos de validación (máximo 3)
  identityVerificationWorkflowId?: string; // ID del workflow de validación (Didit internamente)
  isBlocked?: boolean; // Si el usuario está bloqueado por fallos en validación
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthUser {
  user: User;
  tokens: AuthTokens;
}
