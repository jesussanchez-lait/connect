import { IAuthRepository } from "@/src/domain/repositories/IAuthRepository";
import { PartialUserCredentials } from "@/src/domain/entities/AuthCredentials";

export class CreatePartialUserUseCase {
  constructor(private authRepository: IAuthRepository) {}

  async execute(credentials: PartialUserCredentials): Promise<void> {
    return this.authRepository.createPartialUser(credentials);
  }
}
