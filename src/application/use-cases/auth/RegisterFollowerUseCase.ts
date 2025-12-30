import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import { RegisterCredentials } from "@/src/domain/entities/AuthCredentials";
import { AuthUser } from "@/src/domain/entities/User";

export class RegisterFollowerUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(credentials: RegisterCredentials): Promise<AuthUser> {
    return this.authRepository.registerFollower(credentials);
  }
}

