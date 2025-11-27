import { LoginCredentials, RegisterCredentials } from '../entities/AuthCredentials';
import { AuthUser } from '../entities/User';

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<AuthUser>;
  register(credentials: RegisterCredentials): Promise<AuthUser>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser['user'] | null>;
  refreshToken(refreshToken: string): Promise<AuthUser['tokens']>;
}

