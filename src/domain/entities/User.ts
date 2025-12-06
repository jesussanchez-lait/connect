export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "COORDINATOR"
  | "LINK"
  | "MULTIPLIER"
  | "FOLLOWER";

export type AreaType = "URBAN" | "RURAL";

export interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  name: string;
  role?: UserRole; // Rol del usuario en el sistema
  documentNumber?: string;
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
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthUser {
  user: User;
  tokens: AuthTokens;
}
