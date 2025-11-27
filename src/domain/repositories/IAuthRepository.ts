import {
  LoginCredentials,
  OtpVerification,
  OtpResponse,
} from "../entities/AuthCredentials";
import { AuthUser } from "../entities/User";

export interface IAuthRepository {
  sendOtp(credentials: LoginCredentials): Promise<OtpResponse>;
  verifyOtp(verification: OtpVerification): Promise<AuthUser>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser["user"] | null>;
  refreshToken(refreshToken: string): Promise<AuthUser["tokens"]>;
}
