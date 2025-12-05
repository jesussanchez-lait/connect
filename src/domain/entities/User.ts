export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "COORDINATOR"
  | "LINK"
  | "MULTIPLIER"
  | "FOLLOWER";

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
  leaderId?: string;
  leaderName?: string;
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
