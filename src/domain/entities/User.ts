export interface User {
  id: string;
  email: string;
  name: string;
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

