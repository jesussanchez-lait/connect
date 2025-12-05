import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import {
  LoginCredentials,
  OtpVerification,
  OtpResponse,
  RegisterCredentials,
  PartialUserCredentials,
} from "@/src/domain/entities/AuthCredentials";
import { AuthUser, User } from "@/src/domain/entities/User";
import { IApiClient } from "../api/ApiClient";
import { IStorageService } from "../storage/StorageService";

export class AuthRepository implements IAuthRepository {
  constructor(
    private apiClient: IApiClient,
    private storageService: IStorageService
  ) {}

  async sendOtp(credentials: LoginCredentials): Promise<OtpResponse> {
    return await this.apiClient.post<OtpResponse>(
      "/auth/send-otp",
      credentials
    );
  }

  async verifyOtp(verification: OtpVerification): Promise<AuthUser> {
    const response = await this.apiClient.post<AuthUser>(
      "/auth/verify-otp",
      verification
    );
    this.storageService.setItem("accessToken", response.tokens.accessToken);
    if (response.tokens.refreshToken) {
      this.storageService.setItem("refreshToken", response.tokens.refreshToken);
    }
    return response;
  }

  async createPartialUser(credentials: PartialUserCredentials): Promise<void> {
    // En el repositorio mock, esto no hace nada ya que el registro completo se hace en register
    // En producción, esto podría llamar a un endpoint específico si es necesario
    await Promise.resolve();
  }

  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    const response = await this.apiClient.post<AuthUser>(
      "/auth/register",
      credentials
    );
    this.storageService.setItem("accessToken", response.tokens.accessToken);
    if (response.tokens.refreshToken) {
      this.storageService.setItem("refreshToken", response.tokens.refreshToken);
    }
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.apiClient.post("/auth/logout", {});
    } catch (error) {
      // Continue with logout even if API call fails
      console.error("Logout API call failed:", error);
    } finally {
      this.storageService.removeItem("accessToken");
      this.storageService.removeItem("refreshToken");
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const token = this.storageService.getItem("accessToken");
      if (!token) {
        return null;
      }
      return await this.apiClient.get<User>("/auth/me");
    } catch (error) {
      this.storageService.removeItem("accessToken");
      this.storageService.removeItem("refreshToken");
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthUser["tokens"]> {
    const response = await this.apiClient.post<AuthUser["tokens"]>(
      "/auth/refresh",
      {
        refreshToken,
      }
    );
    this.storageService.setItem("accessToken", response.accessToken);
    if (response.refreshToken) {
      this.storageService.setItem("refreshToken", response.refreshToken);
    }
    return response;
  }
}
