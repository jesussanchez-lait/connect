import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import { EmailPasswordCredentials } from "@/src/domain/entities/AuthCredentials";
import { AuthUser } from "@/src/domain/entities/User";

export class SignInWithEmailPasswordUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(credentials: EmailPasswordCredentials): Promise<AuthUser> {
    return this.authRepository.signInWithEmailPassword(credentials);
  }
}

