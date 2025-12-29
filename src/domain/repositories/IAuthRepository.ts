import {
  LoginCredentials,
  OtpVerification,
  OtpResponse,
  RegisterCredentials,
  PartialUserCredentials,
  EmailPasswordCredentials,
  GoogleSignInCredentials,
} from "../entities/AuthCredentials";
import { AuthUser } from "../entities/User";

export interface IAuthRepository {
  sendOtp(credentials: LoginCredentials): Promise<OtpResponse>;
  verifyOtp(verification: OtpVerification): Promise<AuthUser>;
  createPartialUser(credentials: PartialUserCredentials): Promise<void>;
  register(credentials: RegisterCredentials): Promise<AuthUser>;
  signInWithEmailPassword(credentials: EmailPasswordCredentials): Promise<AuthUser>;
  signInWithGoogle(): Promise<AuthUser>;
  registerWithEmailPassword(credentials: RegisterCredentials): Promise<AuthUser>;
  linkAuthProvider(providerId: string, credential: any): Promise<void>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser["user"] | null>;
  refreshToken(refreshToken: string): Promise<AuthUser["tokens"]>;
}
