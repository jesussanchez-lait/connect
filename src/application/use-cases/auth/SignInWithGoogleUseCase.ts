import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import { AuthUser } from "@/src/domain/entities/User";

export class SignInWithGoogleUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(): Promise<AuthUser> {
    return this.authRepository.signInWithGoogle();
  }
}

