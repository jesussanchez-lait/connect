import {
  LoginCredentials,
  OtpVerification,
  OtpResponse,
  RegisterCredentials,
  PartialUserCredentials,
} from "../entities/AuthCredentials";
import { AuthUser } from "../entities/User";

export interface IAuthRepository {
  sendOtp(credentials: LoginCredentials): Promise<OtpResponse>;
  verifyOtp(verification: OtpVerification): Promise<AuthUser>;
  createPartialUser(credentials: PartialUserCredentials): Promise<void>;
  register(credentials: RegisterCredentials): Promise<AuthUser>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser["user"] | null>;
  refreshToken(refreshToken: string): Promise<AuthUser["tokens"]>;
}
