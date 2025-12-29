import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import { RegisterCredentials } from "@/src/domain/entities/AuthCredentials";
import { AuthUser } from "@/src/domain/entities/User";

export class RegisterWithEmailPasswordUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(credentials: RegisterCredentials): Promise<AuthUser> {
    return this.authRepository.registerWithEmailPassword(credentials);
  }
}

