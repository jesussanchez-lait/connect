import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import { FirebaseAuthRepository } from "@/src/infrastructure/repositories/FirebaseAuthRepository";
import { SendOtpUseCase } from "@/src/application/use-cases/auth/LoginUseCase";
import { VerifyOtpUseCase } from "@/src/application/use-cases/auth/VerifyOtpUseCase";
import { CreatePartialUserUseCase } from "@/src/application/use-cases/auth/CreatePartialUserUseCase";
import { RegisterUseCase } from "@/src/application/use-cases/auth/RegisterUseCase";
import { LogoutUseCase } from "@/src/application/use-cases/auth/LogoutUseCase";
import { GetCurrentUserUseCase } from "@/src/application/use-cases/auth/GetCurrentUserUseCase";

// Infrastructure instances
const authRepository: IAuthRepository = new FirebaseAuthRepository();

// Use cases
export const sendOtpUseCase = new SendOtpUseCase(authRepository);
export const verifyOtpUseCase = new VerifyOtpUseCase(authRepository);
export const createPartialUserUseCase = new CreatePartialUserUseCase(
  authRepository
);
export const registerUseCase = new RegisterUseCase(authRepository);
export const logoutUseCase = new LogoutUseCase(authRepository);
export const getCurrentUserUseCase = new GetCurrentUserUseCase(authRepository);

// Export repositories for direct access if needed
export { authRepository };
