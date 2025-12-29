import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import { FirebaseAuthRepository } from "@/src/infrastructure/repositories/FirebaseAuthRepository";
import { SendOtpUseCase } from "@/src/application/use-cases/auth/LoginUseCase";
import { VerifyOtpUseCase } from "@/src/application/use-cases/auth/VerifyOtpUseCase";
import { CreatePartialUserUseCase } from "@/src/application/use-cases/auth/CreatePartialUserUseCase";
import { RegisterUseCase } from "@/src/application/use-cases/auth/RegisterUseCase";
import { LogoutUseCase } from "@/src/application/use-cases/auth/LogoutUseCase";
import { GetCurrentUserUseCase } from "@/src/application/use-cases/auth/GetCurrentUserUseCase";
import { SignInWithEmailPasswordUseCase } from "@/src/application/use-cases/auth/SignInWithEmailPasswordUseCase";
import { SignInWithGoogleUseCase } from "@/src/application/use-cases/auth/SignInWithGoogleUseCase";
import { RegisterWithEmailPasswordUseCase } from "@/src/application/use-cases/auth/RegisterWithEmailPasswordUseCase";

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
export const signInWithEmailPasswordUseCase = new SignInWithEmailPasswordUseCase(
  authRepository
);
export const signInWithGoogleUseCase = new SignInWithGoogleUseCase(
  authRepository
);
export const registerWithEmailPasswordUseCase =
  new RegisterWithEmailPasswordUseCase(authRepository);

// Export repositories for direct access if needed
export { authRepository };
