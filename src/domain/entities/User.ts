export interface User {
  id: string;
  email?: string;
  phoneNumber?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  neighborhood?: string;
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
