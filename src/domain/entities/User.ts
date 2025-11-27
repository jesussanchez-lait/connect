export interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  name: string;
  documentNumber?: string;
  country?: string;
  department?: string;
  city?: string;
  neighborhood?: string;
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
