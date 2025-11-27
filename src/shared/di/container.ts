import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import { AuthRepository } from "@/src/infrastructure/repositories/AuthRepository";
import { ApiClient, IApiClient } from "@/src/infrastructure/api/ApiClient";
import {
  IStorageService,
  LocalStorageService,
} from "@/src/infrastructure/storage/StorageService";
import { SendOtpUseCase } from "@/src/application/use-cases/auth/LoginUseCase";
import { VerifyOtpUseCase } from "@/src/application/use-cases/auth/VerifyOtpUseCase";
import { LogoutUseCase } from "@/src/application/use-cases/auth/LogoutUseCase";
import { GetCurrentUserUseCase } from "@/src/application/use-cases/auth/GetCurrentUserUseCase";

// Infrastructure instances
const apiClient: IApiClient = new ApiClient();
const storageService: IStorageService = new LocalStorageService();
const authRepository: IAuthRepository = new AuthRepository(
  apiClient,
  storageService
);

// Use cases
export const sendOtpUseCase = new SendOtpUseCase(authRepository);
export const verifyOtpUseCase = new VerifyOtpUseCase(authRepository);
export const logoutUseCase = new LogoutUseCase(authRepository);
export const getCurrentUserUseCase = new GetCurrentUserUseCase(authRepository);

// Export repositories for direct access if needed
export { authRepository };
